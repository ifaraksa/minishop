import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  Mail,
  Phone,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { getAdminOrder, updateOrderStatus } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import type { Order, OrderStatus } from '../../types';
import { formatDateTime, formatRupiah } from '../../utils/format';
import { DRAWER_TRANSITION, EXPO_OUT } from '../../utils/motion';
import { getOrderStatusMeta, ORDER_FLOW_STEPS } from '../../utils/orderStatus';

interface OrderDetailDrawerProps {
  orderId: number | null;
  onClose: () => void;
  onOrderUpdated?: (order: Order) => void;
}

export function OrderDetailDrawer({
  orderId,
  onClose,
  onOrderUpdated,
}: OrderDetailDrawerProps) {
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOpen = Boolean(orderId);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    setConfirmCancel(false);

    let cancelled = false;
    getAdminOrder(orderId)
      .then((res) => {
        if (!cancelled) setOrder(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat detail order.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !updatingStatus) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, updatingStatus, onClose]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || updatingStatus || order.status === newStatus) return;

    setUpdatingStatus(newStatus);
    try {
      const res = await updateOrderStatus(order.id, newStatus);
      setOrder(res.data);
      setConfirmCancel(false);
      onOrderUpdated?.(res.data);

      const meta = getOrderStatusMeta(newStatus);
      showToast(
        newStatus === 'cancelled'
          ? 'Pesanan dibatalkan & stok produk dikembalikan'
          : `Status pesanan diubah menjadi ${meta.label}`,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const statusMeta = order ? getOrderStatusMeta(order.status) : null;
  const isCancelled = order?.status === 'cancelled';
  const currentStepIdx = statusMeta ? statusMeta.step : 0;
  const nextStepStatus: OrderStatus | null =
    order && !isCancelled && currentStepIdx >= 0 && currentStepIdx < ORDER_FLOW_STEPS.length - 1
      ? ORDER_FLOW_STEPS[currentStepIdx + 1]
      : null;
  const nextStepMeta = nextStepStatus ? getOrderStatusMeta(nextStepStatus) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-inspector-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EXPO_OUT }}
          className="fixed inset-0 z-50 flex justify-end bg-[#1A1A18]/30 backdrop-blur-[2px]"
          onClick={() => !updatingStatus && onClose()}
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={DRAWER_TRANSITION}
            className="flex h-full w-full max-w-lg flex-col border-l border-[#1A1A18]/12 bg-[#FAF9F6] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-[#1A1A18]/10 px-6">
              <div>
                <span className="font-mono text-[10px] tracking-[0.1em] text-[#63625C] uppercase">
                  DETAIL PESANAN
                </span>
                <h2
                  id="order-inspector-title"
                  className="mt-0.5 font-mono text-[13.5px] font-medium text-[#1A1A18]"
                >
                  {order ? order.order_number : `Order #${orderId}`}
                </h2>
              </div>
              <button
                type="button"
                disabled={Boolean(updatingStatus)}
                onClick={onClose}
                aria-label="Tutup detail order"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#63625C] transition-colors hover:bg-[#EBE8E0] hover:text-[#1A1A18]"
              >
                <X className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading && !order && (
                <div className="flex flex-col items-center justify-center py-16 text-[#63625C]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1A1A18]" strokeWidth={1.25} />
                  <p className="mt-2 font-mono text-[11px]">Memuat rincian...</p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-[#A1483F]/30 bg-[#F2E1DF] px-4 py-3 text-xs font-medium text-[#A1483F]">
                  {error}
                </div>
              )}

              {order && statusMeta && (
                <div
                  className={`space-y-6 transition-opacity duration-200 ${
                    loading ? 'opacity-55' : 'opacity-100'
                  }`}
                >
                  {/* Status Header & Visual Workflow Stepper */}
                  <div className="rounded-xl border border-[#1A1A18]/10 bg-[#F5F3EE] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-medium ${statusMeta.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                        {statusMeta.label}
                      </span>
                      <span className="font-mono text-[11.5px] text-[#63625C] tabular-nums">
                        {formatDateTime(order.created_at)}
                      </span>
                    </div>

                    {/* Visual Progress Steps (for active orders) */}
                    {!isCancelled ? (
                      <div className="mt-5">
                        <div className="grid grid-cols-4 gap-1.5">
                          {ORDER_FLOW_STEPS.map((stepStatus, idx) => {
                            const meta = getOrderStatusMeta(stepStatus);
                            const done = currentStepIdx >= idx;
                            const active = currentStepIdx === idx;
                            return (
                              <button
                                key={stepStatus}
                                type="button"
                                disabled={Boolean(updatingStatus)}
                                onClick={() => handleStatusChange(stepStatus)}
                                className="group text-left disabled:opacity-60"
                              >
                                <div
                                  className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                                    done
                                      ? 'bg-[#4A6B53]'
                                      : 'bg-[#1A1A18]/12 group-hover:bg-[#1A1A18]/25'
                                  }`}
                                />
                                <span
                                  className={`mt-2 block text-[11px] font-medium transition-colors ${
                                    active
                                      ? 'text-[#1A1A18]'
                                      : done
                                        ? 'text-[#3A5641]'
                                        : 'text-[#8D8B83] group-hover:text-[#1A1A18]'
                                  }`}
                                >
                                  {meta.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick Next-Step Action */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#1A1A18]/8 pt-4">
                          {nextStepStatus && nextStepMeta && (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              disabled={Boolean(updatingStatus)}
                              onClick={() => handleStatusChange(nextStepStatus)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1A1A18] px-3.5 py-2 text-[12px] font-medium text-[#F5F3EE] transition-colors hover:bg-[#2F2F2C] disabled:opacity-55"
                            >
                              {updatingStatus === nextStepStatus ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.25} />
                              ) : (
                                <>
                                  <span>Tandai {nextStepMeta.label}</span>
                                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
                                </>
                              )}
                            </motion.button>
                          )}

                          {!confirmCancel && (
                            <button
                              type="button"
                              disabled={Boolean(updatingStatus)}
                              onClick={() => setConfirmCancel(true)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#A1483F]/25 px-3 py-2 text-[12px] font-medium text-[#A1483F] transition-colors hover:bg-[#F2E1DF]"
                            >
                              <XCircle className="h-3.5 w-3.5" strokeWidth={1.25} />
                              <span>Batalkan</span>
                            </button>
                          )}
                        </div>

                        {/* Inline Cancel Confirmation */}
                        {confirmCancel && (
                          <div className="mt-3 rounded-lg border border-[#A1483F]/30 bg-[#F2E1DF]/70 p-3 text-xs">
                            <div className="flex items-start gap-2 text-[#8E3830]">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                              <p className="leading-relaxed">
                                Membatalkan pesanan akan otomatis mengembalikan stok semua produk
                                di bawah dan tidak dapat dibatalkan ulang.
                              </p>
                            </div>
                            <div className="mt-2.5 flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={Boolean(updatingStatus)}
                                onClick={() => setConfirmCancel(false)}
                                className="rounded-md px-2.5 py-1 text-[11.5px] font-medium text-[#63625C] hover:text-[#1A1A18]"
                              >
                                Tidak
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(updatingStatus)}
                                onClick={() => handleStatusChange('cancelled')}
                                className="inline-flex items-center gap-1 rounded-md bg-[#A1483F] px-3 py-1 text-[11.5px] font-medium text-[#F5F3EE] hover:opacity-90"
                              >
                                {updatingStatus === 'cancelled' && (
                                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
                                )}
                                Ya, Batalkan Order
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#963E35]">
                        <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Pesanan ini telah dibatalkan dan stok produk sudah dikembalikan.
                      </p>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="rounded-xl border border-[#1A1A18]/10 bg-[#FAF9F6] p-4">
                    <span className="font-mono text-[10.5px] tracking-[0.1em] text-[#63625C] uppercase">
                      DATA PELANGGAN
                    </span>
                    <div className="mt-3 space-y-2 text-[13.5px] text-[#1A1A18]">
                      <div className="flex items-center gap-2.5">
                        <User className="h-3.5 w-3.5 text-[#63625C]" strokeWidth={1.25} />
                        <span className="font-medium">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Mail className="h-3.5 w-3.5 text-[#63625C]" strokeWidth={1.25} />
                        <span className="text-[#63625C]">{order.customer_email}</span>
                      </div>
                      {order.customer_phone && (
                        <div className="flex items-center gap-2.5">
                          <Phone className="h-3.5 w-3.5 text-[#63625C]" strokeWidth={1.25} />
                          <span className="font-mono text-[12px] text-[#63625C] tabular-nums">
                            {order.customer_phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div>
                    <span className="font-mono text-[10.5px] tracking-[0.1em] text-[#63625C] uppercase">
                      ITEM DIBELI ({order.items?.length ?? 0})
                    </span>
                    <div className="mt-2.5 overflow-hidden rounded-xl border border-[#1A1A18]/10 bg-[#FAF9F6]">
                      <table className="w-full text-left text-[12.5px]">
                        <thead className="border-b border-[#1A1A18]/8 bg-[#F5F3EE] font-mono text-[10px] text-[#63625C] uppercase">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">Produk</th>
                            <th className="px-3 py-2.5 text-center font-medium">Qty</th>
                            <th className="px-4 py-2.5 text-right font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1A1A18]/8">
                          {(order.items ?? []).map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <p className="font-medium text-[#1A1A18]">{item.product_name}</p>
                                <p className="font-mono text-[11px] text-[#63625C] tabular-nums">
                                  @ {formatRupiah(item.unit_price)}
                                </p>
                              </td>
                              <td className="px-3 py-3 text-center font-mono text-[#1A1A18] tabular-nums">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-medium text-[#1A1A18] tabular-nums">
                                {formatRupiah(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-[#1A1A18]/12 bg-[#F5F3EE]">
                          <tr>
                            <td
                              colSpan={2}
                              className="px-4 py-3 text-right text-[12px] font-medium text-[#63625C]"
                            >
                              Total Pesanan
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[14.5px] font-semibold text-[#1A1A18] tabular-nums">
                              {formatRupiah(order.total_amount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
