import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, RotateCcw } from 'lucide-react';
import { getCategories, getProducts } from '../api/shop';
import { Navbar } from '../components/store/Navbar';
import { ProductCard } from '../components/store/ProductCard';
import { ProductCardSkeleton } from '../components/store/ProductCardSkeleton';
import { ProductIndexLedger } from '../components/store/ProductIndexLedger';
import { StoreCheckoutFlow } from '../components/store/StoreCheckoutFlow';
import { useCart } from '../context/CartContext';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import type { Category, PaginationMeta, Product } from '../types';
import { EXPO_OUT, TAB_SPRING } from '../utils/motion';

interface CatalogRowGroup {
  type: 'asymmetric' | 'triptych';
  startIndex: number;
  items: Product[];
}

/**
 * Alternates between Editorial 2-Column Asymmetric rows (7:5) and
 * Balanced 3-Column rows (4:5) for gallery-grade visual rhythm.
 */
function buildEditorialRows(products: Product[]): CatalogRowGroup[] {
  if (products.length <= 3) {
    return products.length > 0
      ? [{ type: 'triptych', startIndex: 0, items: products }]
      : [];
  }

  const groups: CatalogRowGroup[] = [];
  let cursor = 0;
  let nextType: 'asymmetric' | 'triptych' = 'asymmetric';

  while (cursor < products.length) {
    const remaining = products.length - cursor;
    if (nextType === 'asymmetric' && remaining >= 2) {
      groups.push({
        type: 'asymmetric',
        startIndex: cursor,
        items: products.slice(cursor, cursor + 2),
      });
      cursor += 2;
      nextType = 'triptych';
    } else {
      const take = Math.min(3, remaining);
      groups.push({
        type: 'triptych',
        startIndex: cursor,
        items: products.slice(cursor, cursor + take),
      });
      cursor += take;
      nextType = 'asymmetric';
    }
  }

  return groups;
}

export function CatalogPage() {
  useSmoothScroll(true);
  const { syncCatalogProducts } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({});
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mode, setMode] = useState<'lookbook' | 'index'>('lookbook');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal)
      .then((res) => setCategories(res.data))
      .catch(() => {});
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getProducts(
      {
        search: debouncedSearch || undefined,
        category: selectedCategory || undefined,
        page,
        per_page: 12,
      },
      controller.signal,
    )
      .then((res) => {
        setProducts(res.data);
        setMeta(res.meta);
        setHasLoadedOnce(true);
        syncCatalogProducts(res.data);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Gagal memuat daftar produk.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedSearch, selectedCategory, page, reloadKey, syncCatalogProducts]);

  const visibleProducts = useMemo(
    () => (inStockOnly ? products.filter((p) => p.stock > 0) : products),
    [products, inStockOnly],
  );

  const rowGroups = useMemo(() => buildEditorialRows(visibleProducts), [visibleProducts]);

  const activeCategoryName = useMemo(
    () => categories.find((c) => c.slug === selectedCategory)?.name ?? 'Semua Produk',
    [categories, selectedCategory],
  );

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setInStockOnly(false);
    setPage(1);
  };

  const handleOrderCompleted = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const showInitialSkeleton = loading && !hasLoadedOnce;
  const isRefetching = loading && hasLoadedOnce;
  const hasActiveFilters = Boolean(debouncedSearch || selectedCategory || inStockOnly);
  const totalProducts = meta.total ?? products.length;
  const currentPage = meta.current_page ?? 1;
  const lastPage = meta.last_page ?? 1;

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F3EE]">
      <Navbar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
        totalCount={totalProducts}
        search={searchInput}
        onSearchChange={setSearchInput}
        showCatalogControls
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pt-10 pb-24 md:px-12 lg:px-16 lg:pt-14">
        {/* Refined Editorial Title & Quiet Controls Bar */}
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-[#1A1A18]/12 pb-6">
          <div>
            <p className="font-mono text-[11px] tracking-[0.1em] text-[#63625C] uppercase">
              {selectedCategory ? `KATEGORI / ${activeCategoryName}` : 'KATALOG TERKURASI'}
            </p>
            <h1 className="font-editorial mt-1.5 text-3xl leading-[1.08] text-[#1A1A18] sm:text-[42px]">
              {debouncedSearch ? `“${debouncedSearch}”` : activeCategoryName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.06em] text-[#1A1A18] uppercase underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={1.25} />
                Reset
              </button>
            )}

            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#63625C] select-none hover:text-[#1A1A18]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded-[2px] border-[#1A1A18]/30 accent-[#1A1A18]"
              />
              <span>Tersedia saja</span>
            </label>

            {/* Editorial Mode Switcher with Framer Motion layoutId */}
            <div
              role="group"
              aria-label="Mode tampilan"
              className="inline-flex items-center rounded-[2px] border border-[#1A1A18]/15 bg-[#EBE8E0]/55 p-0.5 font-mono text-[11px] tracking-[0.06em] uppercase"
            >
              {(['lookbook', 'index'] as const).map((tab) => {
                const active = mode === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMode(tab)}
                    className={`relative px-2.5 py-1 transition-colors duration-200 ${
                      active ? 'text-[#F5F3EE]' : 'text-[#63625C] hover:text-[#1A1A18]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="catalogModePill"
                        transition={TAB_SPRING}
                        className="absolute inset-0 rounded-[1px] bg-[#1A1A18]"
                      />
                    )}
                    <span className="relative z-10">{tab === 'lookbook' ? 'Galeri' : 'Index'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isRefetching && (
            <div className="pointer-events-none absolute right-0 -bottom-px left-0 h-[1.5px] overflow-hidden bg-[#1A1A18]/10">
              <div className="animate-progress-slide h-full w-1/2 bg-[#1A1A18]" />
            </div>
          )}
        </div>

        {/* Catalog Body */}
        <div
          className={`mt-12 transition-opacity duration-300 ease-out ${
            isRefetching ? 'opacity-50' : 'opacity-100'
          }`}
        >
          {error ? (
            <div className="border border-[#A1483F]/30 bg-[#FAF9F6] px-6 py-16 text-center">
              <p className="text-[13px] font-medium text-[#A1483F]">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-5 inline-flex items-center gap-2 rounded-[2px] bg-[#1A1A18] px-5 py-2.5 text-[12px] font-medium text-[#F5F3EE] transition hover:bg-[#2F2F2C]"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.25} />
                Muat Ulang
              </button>
            </div>
          ) : showInitialSkeleton ? (
            <div className="space-y-16">
              <div className="grid grid-cols-1 items-start gap-x-10 gap-y-12 md:grid-cols-12">
                <div className="md:col-span-7">
                  <ProductCardSkeleton aspect="landscape" />
                </div>
                <div className="md:col-span-5 md:mt-16">
                  <ProductCardSkeleton aspect="portrait" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-16 border-t border-[#1A1A18]/10 pt-12 md:grid-cols-3">
                <ProductCardSkeleton aspect="gallery" />
                <ProductCardSkeleton aspect="gallery" />
                <ProductCardSkeleton aspect="gallery" />
              </div>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="border border-[#1A1A18]/10 bg-[#FAF9F6]/60 px-6 py-20 text-center">
              <p className="font-mono text-[11px] tracking-[0.12em] text-[#63625C] uppercase">
                00 PRODUK DITEMUKAN
              </p>
              <p className="mt-2 text-[14px] text-[#63625C]">
                Tidak ada produk yang cocok dengan pencarian atau kategori yang dipilih.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 rounded-[2px] border border-[#1A1A18]/25 px-5 py-2.5 text-[12px] font-medium text-[#1A1A18] transition-colors hover:border-[#1A1A18] hover:bg-[#1A1A18] hover:text-[#F5F3EE]"
                >
                  Tampilkan Semua Produk
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {mode === 'index' ? (
                <motion.div
                  key={`index-${selectedCategory}-${debouncedSearch}-${inStockOnly}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.36, ease: EXPO_OUT }}
                >
                  <ProductIndexLedger products={visibleProducts} />
                </motion.div>
              ) : (
                <motion.div
                  key={`lookbook-${selectedCategory}-${debouncedSearch}-${inStockOnly}-${currentPage}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.32, ease: EXPO_OUT }}
                  className="space-y-16 lg:space-y-20"
                >
                  {rowGroups.map((group, groupIdx) => {
                    const dividerClass =
                      groupIdx > 0 ? 'border-t border-[#1A1A18]/10 pt-12 lg:pt-14' : '';

                    if (group.type === 'asymmetric') {
                      const [leftItem, rightItem] = group.items;
                      return (
                        <section
                          key={`row-a-${group.startIndex}`}
                          className={`grid grid-cols-1 items-start gap-x-8 gap-y-14 md:grid-cols-12 lg:gap-x-12 ${dividerClass}`}
                        >
                          {leftItem && (
                            <div className="md:col-span-7">
                              <ProductCard
                                product={leftItem}
                                catalogIndex={group.startIndex}
                                aspect="landscape"
                                staggerIndex={0}
                              />
                            </div>
                          )}
                          {rightItem && (
                            <div className="md:col-span-5 md:mt-16">
                              <ProductCard
                                product={rightItem}
                                catalogIndex={group.startIndex + 1}
                                aspect="portrait"
                                staggerIndex={1}
                              />
                            </div>
                          )}
                        </section>
                      );
                    }

                    return (
                      <section
                        key={`row-b-${group.startIndex}`}
                        className={`grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-3 ${dividerClass}`}
                      >
                        {group.items.map((item, idx) => (
                          <ProductCard
                            key={item.id}
                            product={item}
                            catalogIndex={group.startIndex + idx}
                            aspect="gallery"
                            staggerIndex={idx}
                          />
                        ))}
                      </section>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Pagination */}
          {!showInitialSkeleton && !error && lastPage > 1 && (
            <nav
              aria-label="Navigasi halaman"
              className="mt-16 flex items-center justify-between border-t border-[#1A1A18]/12 pt-6 font-mono text-[12px]"
            >
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1.5 text-[#1A1A18] transition-opacity hover:opacity-70 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.25} />
                Sebelumnya
              </button>
              <span className="text-[#63625C] tabular-nums">
                {String(currentPage).padStart(2, '0')} / {String(lastPage).padStart(2, '0')}
              </span>
              <button
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="inline-flex items-center gap-1.5 text-[#1A1A18] transition-opacity hover:opacity-70 disabled:opacity-30"
              >
                Berikutnya
                <ChevronRight className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </nav>
          )}
        </div>
      </main>

      <footer className="border-t border-[#1A1A18]/10 py-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-6 font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase md:px-12 lg:px-16">
          <span>MINISHOP — KATALOG PRODUK</span>
          <span>STOK REAL-TIME · CHECKOUT INSTAN</span>
        </div>
      </footer>

      <StoreCheckoutFlow onOrderCompleted={handleOrderCompleted} />
    </div>
  );
}
