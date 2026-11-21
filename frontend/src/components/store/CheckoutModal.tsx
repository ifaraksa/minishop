import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Loader2, RefreshCw, X } from 'lucide-react';
import { ApiRequestError } from '../../api/client';
import { createOrder } from '../../api/shop';
import { useCart } from '../../context/CartContext';
import type { Order, StockShortage } from '../../types';
import { formatRupiah } from '../../utils/format';
import { EXPO_OUT, MODAL_TRANSITION } from '../../utils/motion';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { items, subtotal, clearCart, applyStockShortages } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [shortages, setShortages] = useState<StockShortage[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setGeneralError(null);
    setFieldErrors({});
    setShortages([]);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, submitting, onClose]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (items.length === 0 || submitting) return;

    setSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});
    setShortages([]);

    try {
      const response = await createOrder({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim() || undefined,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });

      clearCart();
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      onSuccess(response.data);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === 'INSUFFICIENT_STOCK') {
          setShortages(err.getStockShortages());
          setGeneralError(err.message);
        } else if (err.code === 'VALIDATION_ERROR') {
          setFieldErrors(err.getFieldErrors());
          setGeneralError('Mohon periksa kembali data yang diisi.');
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('Terjadi kesalahan saat memproses checkout.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = () => {
    applyStockShortages(shortages);
    setShortages([]);
    setGeneralError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EXPO_OUT }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A18]/35 p-4 backdrop-blur-[2px]"
          onClick={() => !submitting && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={MODAL_TRANSITION}
            className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1A1A18]/12 bg-[#FAF9F6] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1A1A18]/10 px-6 py-4">
              <div>
                <span className="font-mono text-[10.5px] tracking-[0.12em] text-[#63625C] uppercase">
                  KONFIRMASI PESANAN
                </span>
                <h2
                  id="checkout-modal-title"
                  className="font-editorial mt-0.5 text-[24px] leading-none text-[#1A1A18]"
                >
                  Checkout
                </h2>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                aria-label="Tutup checkout"
                className="flex h-8 w-8 items-center justify-center text-[#63625C] transition-colors hover:text-[#1A1A18] disabled:opacity-40"
              >
                <X className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid divide-y divide-[#1A1A18]/10 md:grid-cols-5 md:divide-x md:divide-y-0"
            >
              <div className="space-y-4 p-6 md:col-span-3">
                {shortages.length > 0 && (
                  <div className="border border-[#96662E]/30 bg-[#F2E7D8] p-4 text-xs text-[#5A3D1B]">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#96662E]"
                        strokeWidth={1.25}
                      />
                      <div className="flex-1">
                        <p className="font-medium">Sebagian stok produk berubah:</p>
                        <ul className="mt-1.5 space-y-1 font-mono text-[11px]">
                          {shortages.map((s) => (
                            <li key={s.product_id}>
                              {s.name} — diminta {s.requested}, tersedia {s.available}
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={handleAdjustStock}
                          className="mt-3 inline-flex items-center gap-1.5 bg-[#1A1A18] px-3 py-1.5 font-mono text-[10.5px] text-[#F5F3EE] uppercase transition hover:bg-[#2F2F2C]"
                        >
                          <RefreshCw className="h-3 w-3" strokeWidth={1.25} />
                          Sesuaikan Stok Otomatis
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {generalError && shortages.length === 0 && (
                  <div className="border border-[#A1483F]/30 bg-[#F2E1DF] px-3.5 py-2.5 text-xs font-medium text-[#A1483F]">
                    {generalError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="customer_name"
                    className="block font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
                  >
                    Nama Lengkap <span className="text-[#A1483F]">*</span>
                  </label>
                  <input
                    id="customer_name"
                    type="text"
                    required
                    maxLength={100}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="mt-1.5 w-full rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-3.5 py-2.5 text-[14px] text-[#1A1A18] placeholder:text-[#9A978E] transition-colors focus:border-[#1A1A18] focus:outline-none"
                  />
                  {fieldErrors.customer_name && (
                    <p className="mt-1 text-xs text-[#A1483F]">{fieldErrors.customer_name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="customer_email"
                    className="block font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
                  >
                    Email <span className="text-[#A1483F]">*</span>
                  </label>
                  <input
                    id="customer_email"
                    type="email"
                    required
                    maxLength={150}
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="budi@email.com"
                    className="mt-1.5 w-full rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-3.5 py-2.5 text-[14px] text-[#1A1A18] placeholder:text-[#9A978E] transition-colors focus:border-[#1A1A18] focus:outline-none"
                  />
                  {fieldErrors.customer_email && (
                    <p className="mt-1 text-xs text-[#A1483F]">{fieldErrors.customer_email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="customer_phone"
                    className="block font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
                  >
                    Nomor HP <span className="text-[#8D8B83] lowercase">(opsional)</span>
                  </label>
                  <input
                    id="customer_phone"
                    type="tel"
                    maxLength={20}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="081234567890"
                    className="mt-1.5 w-full rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-3.5 py-2.5 text-[14px] text-[#1A1A18] placeholder:text-[#9A978E] transition-colors focus:border-[#1A1A18] focus:outline-none"
                  />
                  {fieldErrors.customer_phone && (
                    <p className="mt-1 text-xs text-[#A1483F]">{fieldErrors.customer_phone}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-between bg-[#EBE8E0]/55 p-6 md:col-span-2">
                <div>
                  <span className="font-mono text-[10.5px] tracking-[0.12em] text-[#63625C] uppercase">
                    RINGKASAN
                  </span>
                  <ul className="mt-3 max-h-52 space-y-2.5 overflow-y-auto pr-1 text-xs">
                    {items.map(({ product, quantity }) => (
                      <li key={product.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#1A1A18]">{product.name}</p>
                          <p className="font-mono text-[11px] text-[#63625C] tabular-nums">
                            {quantity} × {formatRupiah(product.price)}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[12px] font-medium text-[#1A1A18] tabular-nums">
                          {formatRupiah(product.price * quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 border-t border-[#1A1A18]/12 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px] font-medium text-[#63625C]">Total</span>
                    <span className="font-mono text-[16px] font-medium text-[#1A1A18] tabular-nums">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting || items.length === 0}
                    className="group mt-4 flex w-full items-center justify-center gap-2 rounded-[2px] bg-[#1A1A18] px-4 py-3 text-[12.5px] font-medium text-[#F5F3EE] transition-colors hover:bg-[#2F2F2C] disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.25} />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span>Buat Order</span>
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                          strokeWidth={1.25}
                        />
                      </>
                    )}
                  </motion.button>
                  <p className="mt-2 text-center font-mono text-[10px] text-[#63625C]">
                    Tanpa payment gateway · Stok langsung berkurang
                  </p>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
