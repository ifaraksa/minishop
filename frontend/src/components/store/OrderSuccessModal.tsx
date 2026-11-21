import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import type { Order } from '../../types';
import { formatDateTime, formatRupiah } from '../../utils/format';
import { EXPO_OUT, MODAL_TRANSITION } from '../../utils/motion';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export function OrderSuccessModal({ order, onClose }: OrderSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [order, onClose]);

  const handleCopy = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore restricted clipboard environments
    }
  };

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-success-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EXPO_OUT }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A18]/35 p-4 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={MODAL_TRANSITION}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2px] border border-[#1A1A18]/18 bg-[#FAF9F6] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-dashed border-[#1A1A18]/20 px-7 pt-7 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[10.5px] tracking-[0.14em] text-[#63625C] uppercase">
                    SLIP KONFIRMASI
                  </span>
                  <h2
                    id="order-success-title"
                    className="font-editorial mt-1 text-[28px] leading-none text-[#1A1A18]"
                  >
                    Order Berhasil
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#4A6B53] bg-[#E4ECE5] px-2.5 py-1 font-mono text-[10px] font-medium tracking-[0.1em] text-[#3A5641] uppercase">
                  <Check className="h-3 w-3" strokeWidth={1.75} />
                  Tercatat
                </span>
              </div>

              <p className="mt-3 text-[13px] leading-[1.6] text-[#63625C]">
                Terima kasih, <span className="font-medium text-[#1A1A18]">{order.customer_name}</span>
                . Pesananmu sudah dicatat dan stok katalog otomatis diperbarui.
              </p>
            </div>

            <div className="border-b border-dashed border-[#1A1A18]/20 bg-[#F5F3EE] px-7 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="block font-mono text-[10px] tracking-[0.12em] text-[#63625C] uppercase">
                    NO. ORDER
                  </span>
                  <span className="mt-0.5 block font-mono text-[14px] font-medium text-[#1A1A18]">
                    {order.order_number}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-2.5 py-1.5 font-mono text-[11px] text-[#1A1A18] transition-colors hover:border-[#1A1A18] hover:bg-[#1A1A18] hover:text-[#F5F3EE]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" strokeWidth={1.5} />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" strokeWidth={1.25} />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#1A1A18]/10 pt-3 text-xs">
                <div>
                  <span className="block font-mono text-[10px] text-[#63625C] uppercase">
                    Email
                  </span>
                  <span className="mt-0.5 block truncate text-[#1A1A18]">
                    {order.customer_email}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block font-mono text-[10px] text-[#63625C] uppercase">
                    Waktu
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] text-[#1A1A18] tabular-nums">
                    {formatDateTime(order.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-7 py-5">
              <span className="font-mono text-[10.5px] tracking-[0.12em] text-[#63625C] uppercase">
                RINCIAN ITEM
              </span>
              {order.items && order.items.length > 0 && (
                <ul className="mt-3 divide-y divide-[#1A1A18]/10 text-[13px]">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#1A1A18]">{item.product_name}</p>
                        <p className="font-mono text-[11px] text-[#63625C] tabular-nums">
                          {item.quantity} × {formatRupiah(item.unit_price)}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[13px] font-medium text-[#1A1A18] tabular-nums">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-[#1A1A18]/20 pt-4">
                <span className="font-mono text-[11px] tracking-[0.1em] text-[#63625C] uppercase">
                  TOTAL
                </span>
                <span className="font-mono text-[19px] font-medium text-[#1A1A18] tabular-nums">
                  {formatRupiah(order.total_amount)}
                </span>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="mt-6 w-full rounded-[2px] bg-[#1A1A18] px-5 py-3 text-[13px] font-medium text-[#F5F3EE] transition-colors hover:bg-[#2F2F2C]"
              >
                Kembali ke Katalog
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
