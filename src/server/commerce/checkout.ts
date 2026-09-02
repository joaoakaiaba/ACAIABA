"use server";

import { prisma } from "@/lib/config/prisma";
import { OrderStatus, PaymentStatus, PaymentMethod, InventoryMovementType } from "@prisma/client";
import { AppError } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import { getActiveSession } from "@/server/auth/session";
import { getGateway } from "@/server/payments/gatewayFactory";
import { validateCoupon, consumeCoupon } from "@/server/commerce/couponService";
import { isValidIdempotencyKey } from "@/lib/commerce/idempotency";

interface CheckoutItem {
  variantId: string;
  quantity: number;
}

interface AddressInput {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  reference?: string;
}

interface CheckoutInput {
  items: CheckoutItem[];
  address: AddressInput;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  shippingCost: number;
  shippingMethod?: string;
  idempotencyKey?: string;
}

export async function processCheckout(input: CheckoutInput) {
  const { items, address, couponCode, paymentMethod, shippingCost, shippingMethod, idempotencyKey } = input;

  // The customer is derived from the authenticated, active session — never trusted from the client.
  const session = await getActiveSession();
  if (!session) {
    throw new AppError("AUTHENTICATION", "Você precisa estar autenticado para finalizar a compra.", 401);
  }

  logger.info("Starting server-side checkout process", { userId: session.userId });

  if (!items || items.length === 0) {
    throw new AppError("BUSINESS", "Seu carrinho está vazio. Adicione itens antes de finalizar a compra.");
  }

  // Idempotency: without a valid key we refuse to create a duplicate-prone order.
  // A retry with the same key must not create a second order.
  if (!isValidIdempotencyKey(idempotencyKey)) {
    throw new AppError(
      "VALIDATION",
      "Chave de idempotência inválida ou ausente. Não é possível garantir checkout único."
    );
  }

  // ---- Validation of the financial inputs that come from the caller ----
  // processCheckout is a Server Action, so an authenticated client can invoke it
  // with arbitrary arguments. Prices are always re-read from the database below,
  // but `quantity` and `shippingCost` are arithmetic inputs to the total: without
  // these checks a caller could send quantity: -5 (negative line totals) or
  // shippingCost: -10000 (total clamped to zero) and get an order for nothing.
  if (typeof shippingCost !== "number" || !Number.isFinite(shippingCost) || shippingCost < 0) {
    throw new AppError("VALIDATION", "Valor de frete inválido.");
  }

  for (const item of items) {
    if (
      typeof item?.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 999
    ) {
      throw new AppError("VALIDATION", "Quantidade de item inválida.");
    }
    if (typeof item?.variantId !== "string" || item.variantId.length === 0) {
      throw new AppError("VALIDATION", "Item de carrinho inválido.");
    }
  }

  // Run everything inside an atomic transaction to ensure absolute financial and inventory integrity
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch and validate Customer for the authenticated user
      const customer = await tx.customer.findUnique({
        where: { userId: session.userId },
        include: { user: true },
      });

      if (!customer) {
        throw new AppError("NOT_FOUND", "Cliente não encontrado. Verifique sua conta.");
      }

      // 2. Idempotency: if an order already exists for this key, return it as a
      //    replay instead of creating a duplicate (and re-decrementing stock).
      const existingByKey = await tx.order.findUnique({ where: { idempotencyKey } });
      if (existingByKey) {
        logger.info(`Checkout replay detected for key ${idempotencyKey}; returning order ${existingByKey.orderNumber}`);
        return {
          idempotent: true,
          orderId: existingByKey.id,
          orderNumber: existingByKey.orderNumber,
          total: Number(existingByKey.total),
          whatsappText: "",
          payment: null,
        };
      }

      // 3. Query DB for current prices and validate stock of each variant
      let subtotal = 0;
      const orderItemsData: any[] = [];
      const stockUpdates: any[] = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            product: true,
            inventory: true,
          },
        });

        if (!variant) {
          throw new AppError("NOT_FOUND", `Variante de produto com ID ${item.variantId} não encontrada.`);
        }

        // Check stock availability
        const currentStock = variant.inventory?.quantity ?? 0;
        const reservedStock = variant.inventory?.reserved ?? 0;
        const availableStock = currentStock - reservedStock;

        if (availableStock < item.quantity) {
          throw new AppError(
            "BUSINESS",
            `Estoque insuficiente para o produto "${variant.product.name}" (Tamanho: ${variant.size || "U"}). Estoque disponível: ${availableStock}.`
          );
        }

        const itemPrice = variant.price ? Number(variant.price) : Number(variant.product.promotionalPrice ?? variant.product.price);
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        // Register the details for snapshot
        orderItemsData.push({
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          sku: variant.sku,
          unitPrice: itemPrice,
          quantity: item.quantity,
          size: variant.size,
          color: variant.color,
          total: itemTotal,
        });

        // Track variant and quantity for stock decrement
        stockUpdates.push({
          inventoryId: variant.inventory!.id,
          variantId: variant.id,
          quantity: item.quantity,
          sku: variant.sku,
        });
      }

      // 4. Finalize coupon discount server-side (centralized rules).
      let couponRowId: string | null = null;
      let couponUsage = false;
      let discountAmount = 0;

      if (couponCode) {
        const { coupon, discount } = await validateCoupon(couponCode, customer.id, subtotal);
        // Resolve the persisted coupon id (snapshot carries business fields only).
        const couponRow = await tx.coupon.findUnique({ where: { code: coupon.code } });
        couponRowId = couponRow?.id ?? null;
        couponUsage = true;
        discountAmount = discount;
      }

      // 5. Calculate final transactional totals
      const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost);

      // 6. Atomically decrement stock and register inventory movements
      for (const update of stockUpdates) {
        // Decrement actual quantity and increment reserved/released if appropriate, or direct sale
        const updatedInventory = await tx.inventory.update({
          where: { id: update.inventoryId },
          data: {
            quantity: { decrement: update.quantity },
          },
        });

        if (updatedInventory.quantity < 0) {
          throw new AppError("BUSINESS", `Erro de concorrência: Estoque ficou negativo para a variante ${update.sku}. Operação abortada.`);
        }

        // Log movement
        await tx.inventoryMovement.create({
          data: {
            inventoryId: update.inventoryId,
            userId: customer.userId,
            type: InventoryMovementType.SALE,
            quantity: -update.quantity,
            reason: `Venda registrada no checkout`,
          },
        });
      }

      // 7. Generate safe Order Number
      const orderNumber = `PED-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      // 8. Create Order in database
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status: OrderStatus.PENDING,
          subtotal,
          discount: discountAmount,
          shipping: shippingCost,
          total: finalTotal,
          addressSnapshot: { ...address, shippingMethod } as any,
          couponId: couponRowId,
          idempotencyKey,
          notes: "Pedido criado via Checkout ACAIABA",
        },
      });

      // 9. Create OrderItems snapshotted (historic preservation)
      for (const item of orderItemsData) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            sku: item.sku,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            total: item.total,
          },
        });
      }

      // 10. Create Payment via the configured gateway (default: simulated PIX).
      //     The charge is created through the gateway abstraction; the record is
      //     persisted atomically with the order inside this transaction.
      const gateway = getGateway();
      const amountCents = Math.round(finalTotal * 100);
      const charge = await gateway.createPayment({
        externalReference: orderNumber,
        amountCents,
        currency: "BRL",
        description: `Pedido ${orderNumber} - ACAIABA`,
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          gateway: charge.provider,
          transactionId: charge.providerPaymentId,
          status: PaymentStatus.PENDING,
          amount: finalTotal,
          method: paymentMethod,
        },
      });

      // 11. Consume Coupon Usage if applicable (atomic, concurrency-safe).
      if (couponUsage && couponRowId) {
        await consumeCoupon(tx, couponRowId, customer.id, order.id);
      }

      // 12. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: customer.userId,
          action: "CREATE",
          entity: "Order",
          entityId: order.id,
          details: {
            orderNumber,
            total: finalTotal,
            subtotal,
            discount: discountAmount,
          },
        },
      });

      // 13. Generate WhatsApp text notification string
      const messageItemsText = orderItemsData
        .map((i) => `- ${i.productName} (${i.size || "U"}/${i.color || "P"}) x${i.quantity}`)
        .join("%0A");
      const whatsappText = `Ol%C3%A1%2C%20gostaria%20de%20finalizar%20o%20pedido%20*${orderNumber}*%20na%20ACAIABA!%0A%0A*Produtos%3A*%0A${messageItemsText}%0A%0A*Total%3A*%20R%24%20${finalTotal.toFixed(2)}`;

      logger.info(`Checkout completed successfully: ${orderNumber}`, { orderId: order.id });

      return {
        orderId: order.id,
        orderNumber,
        total: finalTotal,
        whatsappText,
        payment: {
          transactionId: charge.providerPaymentId,
          provider: charge.provider,
          qrCode: charge.qrCode ?? null,
          qrCodeText: charge.qrCodeText ?? null,
          expiresAt: charge.expiresAt ?? null,
        },
      };
    });

    return result;
  } catch (error: any) {
    // Idempotency race: two concurrent requests with the same key. The unique
    // constraint on idempotencyKey means only one succeeds; the loser must return
    // the already-created order instead of failing or creating a duplicate.
    if (error?.code === "P2002" && Array.isArray(error?.meta?.target) && error.meta.target.includes("idempotencyKey")) {
      const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
      if (existing) {
        logger.info(`Checkout race resolved for key ${idempotencyKey}; returning order ${existing.orderNumber}`);
        return {
          idempotent: true,
          orderId: existing.id,
          orderNumber: existing.orderNumber,
          total: Number(existing.total),
          whatsappText: "",
          payment: null,
        };
      }
    }
    logger.error("Checkout process failed, transactional rollback executed", { error });
    throw error;
  }
}
