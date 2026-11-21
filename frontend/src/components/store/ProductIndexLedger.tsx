import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../types';
import { formatRupiah } from '../../utils/format';
import { EXPO_OUT } from '../../utils/motion';
import { ProductImage } from '../ui/ProductImage';
import { StockBadge } from '../ui/StockBadge';

interface ProductIndexLedgerProps {
  products: Product[];
}

export function ProductIndexLedger({ products }: ProductIndexLedgerProps) {
  const { getItemQuantity, addItem } = useCart();
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(products[0] ?? null);
  const [addedId, setAddedId] = useState<number | null>(null);
  const activePreview =
    products.find((p) => p.id === hoveredProduct?.id) ?? products[0] ?? null;

  const handleQuickAdd = (product: Product) => {
    const added = addItem(product, 1);
    if (added) {
      setAddedId(product.id);
      window.setTimeout(() => {
        setAddedId((curr) => (curr === product.id ? null : curr));
      }, 1200);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Left Interactive Swiss Index */}
      <div className="lg:col-span-8">
        <div className="hidden grid-cols-[44px_1fr_115px_86px_124px_112px] gap-4 border-b border-[#1A1A18]/20 pb-3 font-mono text-[11px] tracking-[0.06em] text-[#63625C] uppercase sm:grid">
          <span>NO</span>
          <span>PRODUK</span>
          <span>KATEGORI</span>
          <span>STOK</span>
          <span className="text-right">HARGA</span>
          <span className="text-right">AKSI</span>
        </div>

        <ul className="divide-y divide-[#1A1A18]/10 border-b border-[#1A1A18]/10">
          {products.map((product, index) => {
            const cartQty = getItemQuantity(product.id);
            const isOutOfStock = product.stock <= 0;
            const reachedStockLimit = cartQty >= product.stock;
            const isActive = activePreview?.id === product.id;
            const justAdded = addedId === product.id;

            return (
              <li
                key={product.id}
                onMouseEnter={() => setHoveredProduct(product)}
                onFocus={() => setHoveredProduct(product)}
                className={`group relative grid grid-cols-1 items-center gap-3 py-4 transition-colors duration-250 sm:grid-cols-[44px_1fr_115px_86px_124px_112px] sm:gap-4 ${
                  isActive ? 'bg-[#EBE8E0]/65' : 'hover:bg-[#EBE8E0]/40'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0 bottom-0 left-0 w-[2px] bg-[#1A1A18] transition-opacity duration-250 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                <span className="pl-2 font-mono text-[12px] text-[#63625C] tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <Link
                  to={`/products/${product.id}`}
                  state={{ product }}
                  className="flex min-w-0 items-center gap-2 pr-2"
                >
                  <span className="editorial-link truncate text-[15px] font-medium tracking-[-0.015em] text-[#1A1A18]">
                    {product.name}
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-[#63625C] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    strokeWidth={1.25}
                  />
                </Link>

                <span className="font-mono text-[11px] tracking-[0.04em] text-[#63625C] uppercase">
                  {product.category?.name ?? '—'}
                </span>

                <div>
                  <StockBadge stock={product.stock} variant="inline" />
                </div>

                <span className="font-mono text-[13px] font-medium text-[#1A1A18] tabular-nums sm:text-right">
                  {formatRupiah(product.price)}
                </span>

                <div className="flex items-center sm:justify-end">
                  {isOutOfStock ? (
                    <span className="font-mono text-[11px] text-[#A1483F] uppercase">Habis</span>
                  ) : (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      disabled={reachedStockLimit && !justAdded}
                      onClick={() => handleQuickAdd(product)}
                      className={`inline-flex items-center gap-1 rounded-[2px] border px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-200 ${
                        justAdded
                          ? 'border-[#4A6B53] bg-[#4A6B53] text-[#F5F3EE]'
                          : reachedStockLimit
                            ? 'cursor-not-allowed border-[#1A1A18]/15 text-[#8D8B83]'
                            : 'border-[#1A1A18]/25 text-[#1A1A18] hover:border-[#1A1A18] hover:bg-[#1A1A18] hover:text-[#F5F3EE]'
                      }`}
                    >
                      {justAdded ? (
                        <>
                          <span>Ditambahkan</span>
                          <Check className="h-3 w-3" strokeWidth={1.5} />
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" strokeWidth={1.25} />
                          <span>Tambah{cartQty > 0 ? ` (${cartQty})` : ''}</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right Sticky Editorial Preview Frame */}
      <aside className="hidden lg:col-span-4 lg:block">
        <div className="sticky top-24 rounded-xl border border-[#1A1A18]/12 bg-[#FAF9F6] p-4">
          <AnimatePresence mode="wait">
            {activePreview && (
              <motion.div
                key={activePreview.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28, ease: EXPO_OUT }}
              >
                <div className="mb-3 flex items-center justify-between font-mono text-[11px] tracking-[0.06em] text-[#63625C] uppercase">
                  <span>PRATINJAU</span>
                  <span className="tabular-nums">#{String(activePreview.id).padStart(3, '0')}</span>
                </div>

                <Link
                  to={`/products/${activePreview.id}`}
                  state={{ product: activePreview }}
                  className="block aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#EAE7DF]"
                >
                  <ProductImage
                    src={activePreview.image_url}
                    alt={activePreview.name}
                    className="h-full w-full"
                    imgClassName="hover:scale-105"
                  />
                </Link>

                <div className="mt-4 border-t border-[#1A1A18]/10 pt-3">
                  <p className="text-[15px] font-medium text-[#1A1A18]">{activePreview.name}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-[#63625C]">
                    {activePreview.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[13px] font-medium text-[#1A1A18] tabular-nums">
                      {formatRupiah(activePreview.price)}
                    </span>
                    <Link
                      to={`/products/${activePreview.id}`}
                      state={{ product: activePreview }}
                      className="font-mono text-[11px] font-medium tracking-[0.06em] text-[#1A1A18] uppercase underline underline-offset-4 hover:opacity-70"
                    >
                      Lihat Detail →
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </div>
  );
}
