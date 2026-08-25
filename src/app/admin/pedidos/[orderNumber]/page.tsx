import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/config/prisma";
import { requireAdmin } from "@/server/auth/guard";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import { ORDER_STATUSES } from "@/lib/orders/orderStatus";
import { ArrowLeft, User, Truck, MapPin, Package, Receipt, Tag } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  AWAITING_PAYMENT: "Aguardando Pagamento",
  PAID: "Pago",
  PROCESSING: "Em Processamento",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

function statusBadge(status: string) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase border tracking-wider";
  if (status === "PAID" || status === "PROCESSING" || status === "SHIPPED" || status === "DELIVERED") {
    return `${base} bg-emerald-50 border-emerald-100 text-emerald-700`;
  }
  if (status === "CANCELLED" || status === "REFUNDED") {
    return `${base} bg-red-50 border-red-100 text-red-700`;
  }
  if (status === "PENDING" || status === "AWAITING_PAYMENT") {
    return `${base} bg-amber-50 border-amber-100 text-amber-700`;
  }
  return `${base} bg-gray-100 border-gray-200 text-gray-500`;
}

async function getAdminOrder(orderNumber: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: { include: { user: true } },
      payment: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
      coupon: true,
    },
  });
  if (!order) return null;

  const address = (order.addressSnapshot as any) || {};

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping: Number(order.shipping),
    total: Number(order.total),
    currency: order.currency,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: {
      name: order.customer.user.name,
      email: order.customer.user.email,
      role: order.customer.user.role,
      userStatus: order.customer.user.status,
      phone: order.customer.phone,
      document: order.customer.document,
    },
    payment: order.payment
      ? {
          method: order.payment.method,
          status: order.payment.status,
          amount: Number(order.payment.amount),
          gateway: order.payment.gateway,
          transactionId: order.payment.transactionId,
          paidAt: order.payment.paidAt,
          createdAt: order.payment.createdAt,
          updatedAt: order.payment.updatedAt,
        }
      : null,
    coupon: order.coupon
      ? {
          code: order.coupon.code,
          type: order.coupon.type,
          value: Number(order.coupon.value),
        }
      : null,
    address: {
      cep: address?.cep || null,
      state: address?.state || null,
      city: address?.city || null,
      neighborhood: address?.neighborhood || null,
      street: address?.street || null,
      number: address?.number || null,
      complement: address?.complement || null,
      reference: address?.reference || null,
      shippingMethod: address?.shippingMethod || null,
    },
    items: order.items.map((i) => ({
      productName: i.productName,
      sku: i.sku,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      total: Number(i.total),
      productSlug: i.variant?.product?.slug || null,
    })),
  };
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  await requireAdmin();
  const order = await getAdminOrder(params.orderNumber);

  if (!order) {
    notFound();
  }

  const itemsTotal = order.items.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-slate-800 pb-5 gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/pedidos"
            className="text-gray-400 hover:text-amber-600 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Detalhes do Pedido
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono uppercase">
              {order.orderNumber} · Criado em {new Date(order.createdAt).toLocaleString("pt-BR")}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 font-mono uppercase">
              Atualizado em {new Date(order.updatedAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
        <span className={statusBadge(order.status)}>{STATUS_LABELS[order.status] || order.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: status control + financial summary + items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status control */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Package className="h-5 w-5 text-amber-600" />
              <span>Alterar Status do Pedido</span>
            </h3>
            <OrderStatusForm orderNumber={order.orderNumber} currentStatus={order.status} statuses={ORDER_STATUSES} />
          </div>

          {/* Order items */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-amber-600" />
              <span>Itens do Pedido</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Variante</th>
                    <th className="px-4 py-3 text-center">Qtd</th>
                    <th className="px-4 py-3 text-right">Preço Unit.</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <tr key={`${item.sku}-${idx}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{item.productName}</p>
                          {item.productSlug && (
                            <span className="text-[10px] text-gray-400 font-mono">/{item.productSlug}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-500 dark:text-gray-400 uppercase">{item.sku}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {[item.size, item.color].filter(Boolean).join(" / ") || "Padrão"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-800 dark:text-gray-100">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                        R$ {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        R$ {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm border-t border-gray-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">R$ {order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Desconto{order.coupon ? ` (${order.coupon.code})` : ""}</span>
                    <span className="font-mono font-bold">- R$ {order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Frete</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">R$ {order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-950 dark:text-white border-t border-gray-100 dark:border-slate-800 pt-3">
                  <span className="font-black uppercase text-sm">Total</span>
                  <span className="font-mono font-black text-base">R$ {order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Moeda</span>
                  <span className="font-bold">{order.currency}</span>
                </div>
                <div className="text-[10px] text-gray-400 italic">Soma dos itens: R$ {itemsTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: customer + address + payment + coupon */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <User className="h-5 w-5 text-amber-600" />
              <span>Cliente</span>
            </h3>
            <div className="text-sm space-y-2">
              <p className="font-bold text-slate-900 dark:text-white">{order.customer.name}</p>
              <p className="text-gray-500 dark:text-gray-400">{order.customer.email}</p>
              {order.customer.phone && <p className="text-gray-500 dark:text-gray-400">Tel: {order.customer.phone}</p>}
              {order.customer.document && <p className="text-gray-500 dark:text-gray-400">Doc: {order.customer.document}</p>}
              <div className="flex gap-2 pt-1">
                {order.customer.role && (
                  <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {order.customer.role}
                  </span>
                )}
                {order.customer.userStatus && (
                  <span className="text-[10px] font-bold uppercase bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                    {order.customer.userStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span>Endereço de Entrega</span>
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p className="font-semibold">
                {[order.address.street, order.address.number].filter(Boolean).join(", ")}
                {order.address.complement ? ` - ${order.address.complement}` : ""}
              </p>
              <p>
                {[order.address.neighborhood, order.address.city].filter(Boolean).join(" - ")}
                {order.address.state ? ` - ${order.address.state}` : ""}
              </p>
              {order.address.cep && <p className="font-mono text-xs text-gray-500 dark:text-gray-400">CEP: {order.address.cep}</p>}
              {order.address.reference && <p className="text-xs text-gray-500 dark:text-gray-400">Ref: {order.address.reference}</p>}
            </div>
          </div>

          {/* Payment / shipping */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Truck className="h-5 w-5 text-amber-600" />
              <span>Pagamento & Envio</span>
            </h3>
            <div className="text-sm space-y-2">
              {order.payment ? (
                <>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Pagamento</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100 uppercase">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Status do Pag.</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100 uppercase">{order.payment.status}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Valor do Pag.</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">R$ {order.payment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Gateway</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{order.payment.gateway}</span>
                  </div>
                  {order.payment.transactionId && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>Transação</span>
                      <span className="font-mono text-[11px] font-bold text-gray-800 dark:text-gray-100">{order.payment.transactionId}</span>
                    </div>
                  )}
                  {order.payment.paidAt && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>Pago em</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        {new Date(order.payment.paidAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 italic">Sem pagamento registrado.</p>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-slate-800 pt-2">
                <span>Método de Envio</span>
                <span className="font-bold text-gray-800 dark:text-gray-100 uppercase">{order.address.shippingMethod || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Coupon */}
          {order.coupon && (
            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
                <Tag className="h-5 w-5 text-amber-600" />
                <span>Cupom</span>
              </h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Código</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{order.coupon.code}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Tipo</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100 uppercase">{order.coupon.type}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Valor</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {order.coupon.type === "PERCENTAGE" ? `${order.coupon.value}%` : `R$ ${order.coupon.value.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3">
                Observações
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
