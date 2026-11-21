import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import type { Product } from '../../types';
import { EXPO_OUT, MODAL_TRANSITION } from '../../utils/motion';

interface DeleteConfirmModalProps {
  product: Product | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  product,
  deleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!product) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, deleting, onCancel]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EXPO_OUT }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A18]/35 p-4 backdrop-blur-[2px]"
          onClick={() => !deleting && onCancel()}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={MODAL_TRANSITION}
            className="w-full max-w-md rounded-2xl border border-[#1A1A18]/12 bg-[#FAF9F6] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-[#A1483F]/30 bg-[#F2E1DF] text-[#A1483F]">
                <AlertTriangle className="h-4 w-4" strokeWidth={1.25} />
              </div>
              <div>
                <h3 id="delete-modal-title" className="text-[15.5px] font-medium text-[#1A1A18]">
                  Hapus Produk dari Inventaris?
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-[#63625C]">
                  <strong className="font-medium text-[#1A1A18]">{product.name}</strong> akan
                  dihapus permanen dari katalog. Riwayat pesanan pelanggan tetap terjaga.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[#1A1A18]/10 pt-4">
              <button
                type="button"
                disabled={deleting}
                onClick={onCancel}
                className="rounded-[2px] border border-[#1A1A18]/20 px-4 py-2 text-[12px] font-medium text-[#63625C] transition-colors hover:border-[#1A1A18] hover:text-[#1A1A18]"
              >
                Batal
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                disabled={deleting}
                onClick={onConfirm}
                className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#A1483F] px-4 py-2 text-[12px] font-medium text-[#F5F3EE] transition hover:opacity-90 disabled:opacity-55"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.25} />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.25} />
                )}
                <span>Hapus</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
