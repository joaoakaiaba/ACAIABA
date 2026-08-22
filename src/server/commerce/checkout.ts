"use server";

import { prisma } from "@/lib/config/prisma";
import { OrderStatus, PaymentStatus, PaymentMethod, InventoryMovementType } from "@prisma/client";
import { AppError } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import { getActiveSession } from "@/server/auth/session";

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
}

export async function processCheckout(input: CheckoutInput) {
  const { items, address, couponCode, paymentMethod, shippingCost } = input;

  // The customer is derived from the authenticated, active session — never trusted from the client.
  const session = await getActiveSession();
  if (!session) {
    throw new AppError("AUTHENTICATION", "Você precisa estar autenticado para finalizar a compra.", 401);
  }

  logger.info("Starting server-side checkout process", { userId: session.userId });

  if (!items || items.length === 0) {
    throw new AppError("BUSINESS", "Seu carrinho está vazio. Adicione itens antes de finalizar a compra.");
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

      // 2. Validate Coupon server-side (if provided)
      let coupon = null;
      let discountAmount = 0;

      if (couponCode) {
        coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        });

        if (!coupon || !coupon.active) {
          throw new AppError("BUSINESS", "Cupom inválido ou inativo.");
        }

        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
          throw new AppError("BUSINESS", "Cupom expirado.");
        }

        if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
          throw new AppError("BUSINESS", "Este cupom atingiu o limite máximo de utilizações.");
        }
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

      // 4. Finalize coupon discount server-side
      if (coupon) {
        if (subtotal < Number(coupon.minSubtotal)) {
          throw new AppError(
            "BUSINESS",
            `Valor mínimo de subtotal para o cupom não atendido. O subtotal deve ser de pelo menos R$ ${Number(coupon.minSubtotal).toFixed(2)}`
          );
        }

        if (coupon.type === "PERCENTAGE") {
          discountAmount = subtotal * (Number(coupon.value) / 100);
        } else {
          discountAmount = Math.min(Number(coupon.value), subtotal);
        }

        // Increment coupon usage count atomically
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
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
          addressSnapshot: address as any,
          couponId: coupon?.id || null,
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

      // 10. Create Payment record (simulating pending or instant gateway creation)
      await tx.payment.create({
        data: {
          orderId: order.id,
          gateway: "SimulatedGateway",
          status: PaymentStatus.PENDING,
          amount: finalTotal,
          method: paymentMethod,
        },
      });

      // 11. Create Coupon Usage if applicable
      if (coupon) {
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            customerId: customer.id,
            orderId: order.id,
          },
        });
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
      };
    });

    return result;
  } catch (error) {
    logger.error("Checkout process failed, transactional rollback executed", { error });
    throw error;
  }
}
