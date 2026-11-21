import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Minus, Plus } from 'lucide-react';
import { getProduct, getProducts } from '../api/shop';
import { Navbar } from '../components/store/Navbar';
import { ProductCard } from '../components/store/ProductCard';
import { StoreCheckoutFlow } from '../components/store/StoreCheckoutFlow';
import { ProductImage } from '../components/ui/ProductImage';
import { StockBadge } from '../components/ui/StockBadge';
import { useCart } from '../context/CartContext';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import type { Product } from '../types';
import { formatRupiah } from '../utils/format';
import { EXPO_OUT } from '../utils/motion';

export function ProductDetailPage() {
  useSmoothScroll(true);
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const productId = Number(id);
  const { addItem, getItemQuantity, openCart } = useCart();

  // Seed immediately from Link state so opening Product Detail has ZERO skeleton flash
  const navProduct = (location.state as { product?: Product } | null)?.product;
  const initialSnapshot = navProduct && navProduct.id === productId ? navProduct : null;

  const [product, setProduct] = useState<Product | null>(initialSnapshot);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  const imageStageRef = useRef<HTMLDivElement>(null);
  const primaryCtaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [productId]);

  useEffect(() => {
    if (!Number.isInteger(productId) || productId <= 0) {
      setError('Produk tidak ditemukan.');
      setLoading(false);
      return;
    }

    const fromNav = (location.state as { product?: Product } | null)?.product;
    const seeded = fromNav && fromNav.id === productId ? fromNav : null;
    if (seeded) {
      setProduct(seeded);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const controller = new AbortController();
    setError(null);
    setQuantity(1);
    setJustAdded(false);

    getProduct(productId, controller.signal)
      .then((res) => {
        setProduct(res.data);

        if (res.data.category?.slug) {
          getProducts({ category: res.data.category.slug, per_page: 4 }, controller.signal)
            .then((rel) => {
              setRelated(rel.data.filter((item) => item.id !== res.data.id).slice(0, 3));
            })
            .catch(() => setRelated([]));
        } else {
          setRelated([]);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!seeded) {
          setError(err instanceof Error ? err.message : 'Gagal memuat detail produk.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [productId, reloadKey, location.state]);

  // 60/120fps optical scroll-linked blur on pinned hero photograph
  useEffect(() => {
    if (!product) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId: number | null = null;

    const updateOnScroll = () => {
      rafId = null;
      const y = window.scrollY;

      if (!reducedMotion && imageStageRef.current) {
        const progress = Math.min(Math.max((y - 40) / 460, 0), 1);
        const blurPx = (progress * 8).toFixed(2);
        const scale = (1 + progress * 0.045).toFixed(4);
        const opacity = (1 - progress * 0.24).toFixed(3);

        imageStageRef.current.style.filter = progress > 0.005 ? `blur(${blurPx}px)` : 'none';
        imageStageRef.current.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        imageStageRef.current.style.opacity = opacity;
      }

      if (primaryCtaRef.current) {
        const rect = primaryCtaRef.current.getBoundingClientRect();
        setShowFloatingBar(rect.bottom < 72);
      }
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateOnScroll);
      }
    };

    updateOnScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [product]);

  const handleOrderCompleted = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const inCartQty = product ? getItemQuantity(product.id) : 0;
  const remainingAddable = product ? Math.max(0, product.stock - inCartQty) : 0;
  const isOutOfStock = !product || product.stock <= 0;
  const maxReachedInCart = !isOutOfStock && remainingAddable === 0;
  const stockMeterPercent = product ? Math.min(100, Math.round((product.stock / 50) * 100)) : 0;

  const handleAddToCart = () => {
    if (!product || remainingAddable <= 0) return;
    const clampedQty = Math.min(quantity, remainingAddable);
    const added = addItem(product, clampedQty);
    if (added) {
      setQuantity(1);
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1200);
      openCart();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F3EE]">
      <Navbar showCatalogControls={false} />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pt-8 pb-24 md:px-12 lg:px-16 lg:pt-10">
        {/* Quiet Breadcrumb */}
        <motion.nav
          aria-label="Breadcrumb"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EXPO_OUT }}
          className="mb-8 flex items-center justify-between border-b border-[#1A1A18]/10 pb-4 font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 transition-colors hover:text-[#1A1A18]"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
              strokeWidth={1.25}
            />
            <span>Katalog</span>
          </Link>
          <span>{product?.category?.name ?? 'KATALOG'}</span>
        </motion.nav>

        {loading && !product ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="aspect-[4/5] animate-pulse rounded-xl bg-[#EAE7DF] lg:col-span-7" />
            <div className="space-y-5 lg:col-span-5">
              <div className="h-3 w-28 animate-pulse rounded bg-[#E3DFD6]" />
              <div className="h-10 w-4/5 animate-pulse rounded bg-[#E3DFD6]" />
              <div className="h-7 w-40 animate-pulse rounded bg-[#E3DFD6]" />
              <div className="mt-8 space-y-2.5">
                <div className="h-3.5 w-full animate-pulse rounded bg-[#EAE7DF]" />
                <div className="h-3.5 w-5/6 animate-pulse rounded bg-[#EAE7DF]" />
              </div>
            </div>
          </div>
        ) : error || !product ? (
          <div className="mx-auto max-w-xl py-24 text-center">
            <p className="font-mono text-[12px] tracking-[0.08em] text-[#A1483F] uppercase">
              {error || 'Produk tidak ditemukan.'}
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1A1A18] px-5 py-3 text-[12.5px] font-medium text-[#F5F3EE] transition hover:bg-[#2F2F2C]"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.25} />
              Kembali ke Katalog
            </Link>
          </div>
        ) : (
          <>
            {/* Silky Choreographed Split Monograph */}
            <section
              key={product.id}
              className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14"
            >
              {/* Left Sticky Soft-Framed Visual Stage with Optical Scroll-Blur */}
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.65, ease: EXPO_OUT }}
                className="lg:sticky lg:top-24 lg:col-span-7"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#EAE7DF] sm:aspect-[5/5] lg:max-h-[calc(100vh-8rem)]">
                  <div
                    ref={imageStageRef}
                    className="h-full w-full will-change-[transform,filter,opacity]"
                  >
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full"
                      imgClassName={isOutOfStock ? 'opacity-50 grayscale-[50%]' : ''}
                    />
                  </div>

                  <div className="pointer-events-none absolute top-4 left-4 rounded-md bg-[#F5F3EE]/85 px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] text-[#63625C] uppercase backdrop-blur-sm">
                    PRODUK #{String(product.id).padStart(3, '0')}
                  </div>
                </div>
              </motion.div>

              {/* Right Scrollable Dossier */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08, ease: EXPO_OUT }}
                className="flex flex-col justify-between lg:col-span-5 lg:py-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <StockBadge stock={product.stock} variant="inline" />
                    <span className="font-mono text-[11px] text-[#63625C] uppercase">
                      MS-{String(product.id).padStart(4, '0')}
                    </span>
                  </div>

                  <h1 className="font-editorial mt-4 text-3xl leading-[1.12] text-[#1A1A18] sm:text-[38px]">
                    {product.name}
                  </h1>

                  <p className="mt-4 font-mono text-[22px] font-medium text-[#1A1A18] tabular-nums">
                    {formatRupiah(product.price)}
                  </p>

                  {/* Description */}
                  <div className="mt-8 border-t border-[#1A1A18]/10 pt-6">
                    <h2 className="font-mono text-[11px] tracking-[0.1em] text-[#63625C] uppercase">
                      DESKRIPSI
                    </h2>
                    <p className="mt-3 text-[14.5px] leading-[1.7] text-[#63625C]">
                      {product.description ||
                        'Objek esensial pilihan dengan proporsi bersih dan fungsi yang jelas untuk penggunaan harian.'}
                    </p>
                  </div>

                  {/* Hairline Specification Table */}
                  <dl className="mt-8 divide-y divide-[#1A1A18]/10 border-y border-[#1A1A18]/10 font-mono text-[11.5px]">
                    <div className="flex items-center justify-between py-3">
                      <dt className="tracking-[0.06em] text-[#63625C] uppercase">KATEGORI</dt>
                      <dd className="text-[#1A1A18]">{product.category?.name ?? 'Umum'}</dd>
                    </div>
                    <div className="py-3">
                      <div className="flex items-center justify-between">
                        <dt className="tracking-[0.06em] text-[#63625C] uppercase">KETERSEDIAAN</dt>
                        <dd className="text-[#1A1A18] tabular-nums">
                          {product.stock > 0 ? `${product.stock} UNIT` : 'HABIS'}
                        </dd>
                      </div>
                      <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-[#1A1A18]/10">
                        <div
                          style={{ width: `${stockMeterPercent}%` }}
                          className={`h-full transition-all duration-500 ${
                            product.stock <= 0
                              ? 'bg-[#A1483F]'
                              : product.stock <= 5
                                ? 'bg-[#96662E]'
                                : 'bg-[#4A6B53]'
                          }`}
                        />
                      </div>
                    </div>
                  </dl>
                </div>

                {/* Purchase Controls */}
                <div className="mt-10">
                  {inCartQty > 0 && (
                    <div className="mb-4 flex items-center justify-between rounded-lg border border-[#4A6B53]/30 bg-[#E4ECE5] px-4 py-2.5 font-mono text-[11.5px] text-[#3A5641]">
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {inCartQty} unit di keranjang
                      </span>
                      <button
                        type="button"
                        onClick={openCart}
                        className="underline underline-offset-4 hover:text-[#1A1A18]"
                      >
                        Lihat
                      </button>
                    </div>
                  )}

                  {!isOutOfStock && !maxReachedInCart && (
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase">
                        JUMLAH
                      </span>
                      <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#1A1A18]/20 bg-[#FAF9F6]">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          aria-label="Kurangi jumlah"
                          className="flex h-10 w-10 items-center justify-center text-[#1A1A18] transition-colors hover:bg-[#EBE8E0] disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={1.25} />
                        </button>
                        <span className="min-w-12 text-center font-mono text-[13px] font-medium text-[#1A1A18] tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.min(remainingAddable, q + 1))}
                          disabled={quantity >= remainingAddable}
                          aria-label="Tambah jumlah"
                          className="flex h-10 w-10 items-center justify-center text-[#1A1A18] transition-colors hover:bg-[#EBE8E0] disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.25} />
                        </button>
                      </div>
                    </div>
                  )}

                  <motion.button
                    ref={primaryCtaRef}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    disabled={isOutOfStock || (maxReachedInCart && !justAdded)}
                    onClick={handleAddToCart}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-[13px] font-medium tracking-[0.02em] transition-colors duration-250 disabled:cursor-not-allowed disabled:bg-[#EBE8E0] disabled:text-[#8D8B83] ${
                      justAdded
                        ? 'bg-[#4A6B53] text-[#F5F3EE]'
                        : 'bg-[#1A1A18] text-[#F5F3EE] hover:bg-[#2F2F2C]'
                    }`}
                  >
                    {isOutOfStock ? (
                      <span>Stok Sedang Habis</span>
                    ) : justAdded ? (
                      <>
                        <span>Ditambahkan</span>
                        <Check className="h-4 w-4" strokeWidth={1.5} />
                      </>
                    ) : maxReachedInCart ? (
                      <span>Maksimal Stok di Keranjang</span>
                    ) : (
                      <span className="tabular-nums">
                        + Tambah ke Keranjang — {formatRupiah(product.price * quantity)}
                      </span>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </section>

            {/* Related Editorial Triptych */}
            {related.length > 0 && (
              <section className="mt-20 border-t border-[#1A1A18]/10 pt-14">
                <div className="mb-10 flex items-end justify-between">
                  <div>
                    <span className="font-mono text-[11px] tracking-[0.1em] text-[#63625C] uppercase">
                      SERUPA
                    </span>
                    <h2 className="font-editorial mt-1 text-2xl text-[#1A1A18] sm:text-[28px]">
                      Lainnya di {product.category?.name}
                    </h2>
                  </div>
                  <Link
                    to="/"
                    className="font-mono text-[11px] tracking-[0.08em] text-[#1A1A18] uppercase underline underline-offset-4 hover:opacity-70"
                  >
                    Semua Produk →
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-3">
                  {related.map((item, idx) => (
                    <ProductCard
                      key={item.id}
                      product={item}
                      catalogIndex={idx}
                      aspect="gallery"
                      staggerIndex={idx}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Frosted-Glass Floating Quick-Buy Bar */}
            <AnimatePresence>
              {showFloatingBar && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.35, ease: EXPO_OUT }}
                  className="fixed right-4 bottom-5 left-4 z-40 mx-auto max-w-xl"
                >
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-[#1A1A18]/15 bg-[#F5F3EE]/85 px-4 py-3 shadow-xl shadow-[#1A1A18]/10 backdrop-blur-xl">
                    <div className="flex min-w-0 items-center gap-3">
                      <ProductImage
                        src={product.image_url}
                        alt={product.name}
                        className="h-10 w-8 shrink-0 rounded-md"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[#1A1A18]">
                          {product.name}
                        </p>
                        <p className="font-mono text-[12px] text-[#63625C] tabular-nums">
                          {formatRupiah(product.price)}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      disabled={isOutOfStock || maxReachedInCart}
                      onClick={handleAddToCart}
                      className="shrink-0 rounded-lg bg-[#1A1A18] px-4 py-2 text-[12px] font-medium text-[#F5F3EE] transition-colors hover:bg-[#2F2F2C] disabled:bg-[#EBE8E0] disabled:text-[#8D8B83]"
                    >
                      {isOutOfStock ? 'Habis' : maxReachedInCart ? 'Maks.' : '+ Tambah'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      <StoreCheckoutFlow onOrderCompleted={handleOrderCompleted} />
    </div>
  );
}
