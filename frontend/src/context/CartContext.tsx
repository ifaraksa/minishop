import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Product, StockShortage } from '../types';
import { useToast } from './ToastContext';

const CART_STORAGE_KEY = 'minishop_cart_v1';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  getItemQuantity: (productId: number) => number;
  addItem: (product: Product, quantity?: number) => boolean;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  syncCatalogProducts: (products: Product[]) => void;
  applyStockShortages: (shortages: StockShortage[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is CartItem =>
        entry &&
        typeof entry === 'object' &&
        typeof entry.quantity === 'number' &&
        entry.quantity > 0 &&
        entry.product &&
        typeof entry.product.id === 'number' &&
        typeof entry.product.name === 'string' &&
        typeof entry.product.price === 'number' &&
        typeof entry.product.stock === 'number',
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitialCart);
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota issues
    }
  }, [items]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const getItemQuantity = useCallback(
    (productId: number) => items.find((item) => item.product.id === productId)?.quantity ?? 0,
    [items],
  );

  const addItem = useCallback(
    (product: Product, quantity = 1): boolean => {
      if (product.stock <= 0) {
        showToast('Stok produk sedang habis.', 'warning');
        return false;
      }

      const existing = items.find((item) => item.product.id === product.id);
      const currentQty = existing?.quantity ?? 0;
      const nextQty = currentQty + quantity;

      if (nextQty > product.stock) {
        showToast(`Maksimal ${product.stock} unit sesuai stok tersedia.`, 'warning');
        return false;
      }

      setItems((prev) => {
        const found = prev.find((item) => item.product.id === product.id);
        if (found) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { product, quantity: Math.min(item.quantity + quantity, product.stock) }
              : item,
          );
        }
        return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
      });

      showToast(`${product.name} ditambahkan ke keranjang`, 'success');
      return true;
    },
    [items, showToast],
  );

  const updateQuantity = useCallback(
    (productId: number, quantity: number) => {
      const target = items.find((item) => item.product.id === productId);
      if (!target) return;

      if (quantity <= 0) {
        setItems((prev) => prev.filter((item) => item.product.id !== productId));
        showToast(`${target.product.name} dihapus dari keranjang`, 'info');
        return;
      }

      if (quantity > target.product.stock) {
        showToast(`Stok tersisa hanya ${target.product.stock} unit.`, 'warning');
        setItems((prev) =>
          prev.map((item) =>
            item.product.id === productId ? { ...item, quantity: item.product.stock } : item,
          ),
        );
        return;
      }

      setItems((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
      );
    },
    [items, showToast],
  );

  const removeItem = useCallback(
    (productId: number) => {
      const target = items.find((item) => item.product.id === productId);
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      if (target) {
        showToast(`${target.product.name} dihapus dari keranjang`, 'info');
      }
    },
    [items, showToast],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const syncCatalogProducts = useCallback((products: Product[]) => {
    if (products.length === 0) return;
    const byId = new Map(products.map((p) => [p.id, p]));
    setItems((prev) =>
      prev
        .map((item) => {
          const fresh = byId.get(item.product.id);
          if (!fresh) return item;
          return {
            product: fresh,
            quantity: fresh.stock > 0 ? Math.min(item.quantity, fresh.stock) : 0,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const applyStockShortages = useCallback(
    (shortages: StockShortage[]) => {
      const byId = new Map(shortages.map((s) => [s.product_id, s]));
      setItems((prev) =>
        prev
          .map((item) => {
            const shortage = byId.get(item.product.id);
            if (!shortage) return item;
            return {
              product: { ...item.product, stock: shortage.available },
              quantity: Math.min(item.quantity, shortage.available),
            };
          })
          .filter((item) => item.quantity > 0),
      );
      showToast('Jumlah item disesuaikan dengan stok terbaru', 'info');
    },
    [showToast],
  );

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      getItemQuantity,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncCatalogProducts,
      applyStockShortages,
    }),
    [
      items,
      totalItems,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      getItemQuantity,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncCatalogProducts,
      applyStockShortages,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
