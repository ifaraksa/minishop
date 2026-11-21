import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { EXPO_OUT } from '../utils/motion';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = toastIdCounter++;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 3000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-6 bottom-6 left-6 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:max-w-sm"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.32, ease: EXPO_OUT }}
              className="pointer-events-auto flex w-full items-center gap-3 rounded-[2px] border border-[#1A1A18]/20 bg-[#1A1A18] px-4 py-3 text-[12.5px] font-medium text-[#F5F3EE] shadow-lg sm:w-auto"
            >
              {toast.variant === 'success' && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[#8BB596]" strokeWidth={1.75} />
              )}
              {toast.variant === 'error' && (
                <X className="h-3.5 w-3.5 shrink-0 text-[#E08A82]" strokeWidth={1.75} />
              )}
              {toast.variant === 'warning' && (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#E2B576]" strokeWidth={1.5} />
              )}
              {toast.variant === 'info' && (
                <Info className="h-3.5 w-3.5 shrink-0 text-[#B4B2AA]" strokeWidth={1.5} />
              )}
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="p-0.5 text-[#8D8B83] transition-colors hover:text-[#F5F3EE]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.25} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
