import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatRupiah } from '../../utils/format';
import { DRAWER_TRANSITION, EXPO_OUT } from '../../utils/motion';
import { ProductImage } from '../ui/ProductImage';

interface CartDrawerProps {
  onCheckout: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, totalItems, subtotal, isOpen, closeCart, updateQuantity, removeItem, clearCart } =
    useCart();

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Keranjang Belanja"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EXPO_OUT }}
          className="fixed inset-0 z-50 flex justify-end bg-[#1A1A18]/30 backdrop-blur-[2px]"
          onClick={closeCart}
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={DRAWER_TRANSITION}
            className="flex h-full w-full max-w-md flex-col border-l border-[#1A1A18]/12 bg-[#F5F3EE] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-[#1A1A18]/10 px-6">
              <div className="flex items-baseline gap-2.5">
                <h2 className="font-editorial text-[22px] leading-none text-[#1A1A18]">
                  Keranjang
                </h2>
                <span className="font-mono text-[11px] text-[#63625C] tabular-nums">
                  [{totalItems}]
                </span>
              </div>

              <div className="flex items-center gap-3">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="font-mono text-[11px] tracking-[0.04em] text-[#A1483F] uppercase hover:underline"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="Tutup keranjang"
                  className="flex h-8 w-8 items-center justify-center text-[#63625C] transition-colors hover:text-[#1A1A18]"
                >
                  <X className="h-4 w-4" strokeWidth={1.25} />
                </button>
              </div>
            </div>

            {/* Body */}
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="font-mono text-[11px] tracking-[0.12em] text-[#63625C] uppercase">
                  KERANJANG KOSONG
                </span>
                <p className="mt-2 max-w-xs text-[13px] leading-[1.6] text-[#63625C]">
                  Pilih objek dari katalog untuk mulai menyusun daftar pesananmu.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-6 rounded-[2px] border border-[#1A1A18]/25 px-5 py-2.5 text-[12px] font-medium text-[#1A1A18] transition-colors duration-250 hover:border-[#1A1A18] hover:bg-[#1A1A18] hover:text-[#F5F3EE]"
                >
                  Jelajahi Katalog
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-[#1A1A18]/10 overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {items.map(({ product, quantity }) => {
                      const atLimit = quantity >= product.stock;
                      return (
                        <motion.li
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                          transition={{ duration: 0.28, ease: EXPO_OUT }}
                          className="flex gap-4 py-5"
                        >
                          <ProductImage
                            src={product.image_url}
                            alt={product.name}
                            className="h-22 w-18 shrink-0 rounded-lg"
                          />
                          <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="truncate text-[14.5px] font-medium text-[#1A1A18]">
                                  {product.name}
                                </h4>
                                <p className="mt-0.5 font-mono text-[11.5px] text-[#63625C] tabular-nums">
                                  {formatRupiah(product.price)} / unit
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(product.id)}
                                aria-label={`Hapus ${product.name}`}
                                className="p-1 text-[#8D8B83] transition-colors hover:text-[#A1483F]"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.25} />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-2">
                              <div className="inline-flex items-center rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6]">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product.id, quantity - 1)}
                                  aria-label={`Kurangi ${product.name}`}
                                  className="flex h-7 w-7 items-center justify-center text-[#1A1A18] transition-colors hover:bg-[#EBE8E0]"
                                >
                                  <Minus className="h-3 w-3" strokeWidth={1.25} />
                                </button>
                                <span className="min-w-7 text-center font-mono text-[12px] text-[#1A1A18] tabular-nums">
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product.id, quantity + 1)}
                                  disabled={atLimit}
                                  aria-label={`Tambah ${product.name}`}
                                  className="flex h-7 w-7 items-center justify-center text-[#1A1A18] transition-colors hover:bg-[#EBE8E0] disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <Plus className="h-3 w-3" strokeWidth={1.25} />
                                </button>
                              </div>

                              <div className="text-right">
                                <span className="block font-mono text-[13px] font-medium text-[#1A1A18] tabular-nums">
                                  {formatRupiah(product.price * quantity)}
                                </span>
                                {atLimit && (
                                  <span className="font-mono text-[10px] text-[#96662E]">
                                    MAKS. STOK ({product.stock})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>

                {/* Footer */}
                <div className="border-t border-[#1A1A18]/12 bg-[#EBE8E0]/60 p-6">
                  <div className="space-y-2 text-[13px]">
                    <div className="flex items-center justify-between text-[#63625C]">
                      <span>Jumlah Item</span>
                      <span className="font-mono text-[#1A1A18] tabular-nums">{totalItems} pcs</span>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-[#1A1A18]/10 pt-3">
                      <span className="font-medium text-[#1A1A18]">Subtotal</span>
                      <span className="font-mono text-[18px] font-medium text-[#1A1A18] tabular-nums">
                        {formatRupiah(subtotal)}
                      </span>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={onCheckout}
                    className="group mt-5 flex w-full items-center justify-center gap-2 rounded-[2px] bg-[#1A1A18] px-5 py-3.5 text-[13px] font-medium tracking-[0.02em] text-[#F5F3EE] transition-colors duration-250 hover:bg-[#2F2F2C]"
                  >
                    <span>Lanjut ke Pembayaran</span>
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      strokeWidth={1.25}
                    />
                  </motion.button>
                  <p className="mt-2.5 text-center font-mono text-[10.5px] text-[#63625C]">
                    Tersimpan otomatis di browser ini
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
