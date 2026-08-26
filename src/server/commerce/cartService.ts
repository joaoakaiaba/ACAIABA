"use server";

import { prisma } from "@/lib/config/prisma";
import { getActiveSession } from "@/server/auth/session";
import { AppError } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";

export interface CartLineView {
  id: string; // cartItem id
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  size: string | null;
  color: string | null;
  unitPrice: number; // effective (promotional) price, server-derived
  basePrice: number;
  quantity: number;
  total: number;
  imageUrl: string | null;
  availableStock: number;
}

export interface CartView {
  customerId: string;
  lines: CartLineView[];
  subtotal: number;
  itemsCount: number;
}

// Returns the authenticated customer's persisted cart (or an empty one). The
// price shown is always server-derived — never trusted from the client.
// Shape da variante juntada às linhas do carrinho
// (include Prisma: product{images} + inventory).
interface CartLineVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    promotionalPrice: number | null;
    images: { url: string }[];
  };
  inventory: { quantity: number; reserved: number } | null;
}

export async function getCart(): Promise<CartView> {
  const session = await getActiveSession();
  if (!session) {
    throw new AppError("AUTHENTICATION", "Não autenticado.", 401);
  }

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) {
    return { customerId: "", lines: [], subtotal: 0, itemsCount: 0 };
  }

  const cart = await prisma.cart.upsert({
    where: { customerId: customer.id },
    update: {},
    create: { customerId: customer.id },
    include: { items: true },
  });

  // CartItem não possui relação Prisma com ProductVariant (apenas o FK
  // `variantId`), então as variantes são carregadas em uma segunda consulta
  // e juntadas aqui — preservando o comportamento anterior do carrinho.
  const variantIds: string[] = cart.items.map(
    (i: { variantId: string }) => i.variantId
  );
  const variants = variantIds.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          product: { include: { images: { orderBy: { order: "asc" }, take: 1 } } },
          inventory: true,
        },
      })
    : [];
  const variantById = new Map<string, CartLineVariant>(
    (variants as unknown as CartLineVariant[]).map((v) => [v.id, v])
  );

  const lines: CartLineView[] = cart.items
    .map((item: { id: string; variantId: string; quantity: number }) => {
      const variant = variantById.get(item.variantId);
      if (!variant) return null;
      const product = variant.product;
      const basePrice = Number(variant.price ?? product.promotionalPrice ?? product.price);
      const promo = product.promotionalPrice ? Number(product.promotionalPrice) : null;
      const unitPrice = promo !== null && promo < basePrice ? promo : basePrice;
      const quantity = item.quantity;
      const availableStock = (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);
      return {
        id: item.id,
        variantId: item.variantId,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        unitPrice,
        basePrice,
        quantity,
        total: unitPrice * quantity,
        imageUrl: product.images[0]?.url ?? null,
        availableStock,
      };
    })
    .filter(
      (l: CartLineView | null): l is CartLineView =>
        l !== null && l.availableStock >= 0
    );

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const itemsCount = lines.reduce((s, l) => s + l.quantity, 0);

  return { customerId: customer.id, lines, subtotal, itemsCount };
}

// Adds a variant to the cart (creates the item or increments quantity).
// The effective unit price is derived server-side; stock is validated.
export async function addCartItem(variantId: string, quantity: number): Promise<CartView> {
  const session = await getActiveSession();
  if (!session) throw new AppError("AUTHENTICATION", "Não autenticado.", 401);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AppError("VALIDATION", "Quantidade inválida.");
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true, inventory: true },
  });
  if (!variant) throw new AppError("NOT_FOUND", "Variante de produto não encontrada.", 404);

  const available = (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);
  if (available < quantity) {
    throw new AppError("BUSINESS", "Estoque insuficiente para a quantidade solicitada.");
  }

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) throw new AppError("NOT_FOUND", "Cliente não encontrado.", 404);

  const cart = await prisma.cart.upsert({
    where: { customerId: customer.id },
    update: {},
    create: { customerId: customer.id },
  });

  // Existing line for the same variant: increment, capped at available stock.
  const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, variantId } });
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > available) {
      throw new AppError("BUSINESS", "Quantidade excede o estoque disponível.");
    }
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity } });
  }

  logger.info(`Cart: added variant ${variantId} x${quantity} for customer ${customer.id}`);
  return getCart();
}

// Updates the quantity of a cart line (or removes it if qty <= 0).
export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartView> {
  const session = await getActiveSession();
  if (!session) throw new AppError("AUTHENTICATION", "Não autenticado.", 401);

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) throw new AppError("NOT_FOUND", "Cliente não encontrado.", 404);

  const cart = await prisma.cart.findUnique({ where: { customerId: customer.id } });
  if (!cart) throw new AppError("NOT_FOUND", "Carrinho não encontrado.", 404);

  const item = await prisma.cartItem.findFirst({ where: { id: cartItemId, cartId: cart.id } });
  if (!item) throw new AppError("NOT_FOUND", "Item não encontrado no carrinho.", 404);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    // Remove the item.
    await prisma.cartItem.delete({ where: { id: item.id } });
    return getCart();
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: item.variantId },
    include: { inventory: true },
  });
  const available = (variant?.inventory?.quantity ?? 0) - (variant?.inventory?.reserved ?? 0);
  if (available < quantity) {
    throw new AppError("BUSINESS", "Quantidade excede o estoque disponível.");
  }

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return getCart();
}

// Removes a cart line.
export async function removeCartItem(cartItemId: string): Promise<CartView> {
  const session = await getActiveSession();
  if (!session) throw new AppError("AUTHENTICATION", "Não autenticado.", 401);

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) throw new AppError("NOT_FOUND", "Cliente não encontrado.", 404);

  const cart = await prisma.cart.findUnique({ where: { customerId: customer.id } });
  if (!cart) throw new AppError("NOT_FOUND", "Carrinho não encontrado.", 404);

  const item = await prisma.cartItem.findFirst({ where: { id: cartItemId, cartId: cart.id } });
  if (!item) throw new AppError("NOT_FOUND", "Item não encontrado no carrinho.", 404);

  await prisma.cartItem.delete({ where: { id: item.id } });
  return getCart();
}

// Clears the entire cart.
export async function clearCart(): Promise<CartView> {
  const session = await getActiveSession();
  if (!session) throw new AppError("AUTHENTICATION", "Não autenticado.", 401);

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) throw new AppError("NOT_FOUND", "Cliente não encontrado.", 404);

  await prisma.cartItem.deleteMany({ where: { cart: { customerId: customer.id } } });
  return getCart();
}
