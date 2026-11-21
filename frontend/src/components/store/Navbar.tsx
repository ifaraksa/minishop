import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import type { Category } from '../../types';
import { EXPO_OUT, TAB_SPRING } from '../../utils/motion';

interface NavbarProps {
  categories?: Category[];
  selectedCategory?: string;
  onSelectCategory?: (slug: string) => void;
  totalCount?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  showCatalogControls?: boolean;
}

export function Navbar({
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  totalCount,
  search = '',
  onSearchChange,
  showCatalogControls = false,
}: NavbarProps) {
  const { totalItems, openCart } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!showCatalogControls || !onSearchChange) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCatalogControls, onSearchChange, searchOpen]);

  const handleCloseSearch = () => {
    setSearchOpen(false);
    onSearchChange?.('');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#1A1A18]/10 bg-[#F5F3EE]/85 backdrop-blur-md transition-colors duration-300">
      {/* Main 64px Editorial Bar */}
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-6 md:px-12 lg:px-16">
        {/* Left: Crisp Modern Brand Wordmark + Subtle Mono Item Count */}
        <div className="flex items-center gap-3.5">
          <Link
            to="/"
            onClick={() => {
              onSelectCategory?.('');
              onSearchChange?.('');
            }}
            className="group flex items-center gap-2.5 text-[#1A1A18]"
          >
            <span className="block h-3.5 w-3.5 rounded-[2px] bg-[#1A1A18] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90" />
            <span className="text-[17px] font-bold tracking-[-0.03em]">
              MiniShop
            </span>
          </Link>
          {typeof totalCount === 'number' && (
            <span className="hidden border-l border-[#1A1A18]/15 pl-3.5 font-mono text-[11px] tracking-[0.06em] text-[#63625C] uppercase tabular-nums sm:inline">
              {String(totalCount).padStart(2, '0')} PRODUK
            </span>
          )}
        </div>

        {/* Center: Minimalist Category Filter Tabs with Framer Motion layoutId */}
        {showCatalogControls && onSelectCategory && (
          <nav
            aria-label="Filter kategori"
            className="hidden items-center gap-1 lg:flex"
          >
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className={`relative px-3 py-1.5 text-[12.5px] font-medium tracking-[-0.01em] transition-colors duration-200 ${
                selectedCategory === ''
                  ? 'text-[#1A1A18]'
                  : 'text-[#63625C] hover:text-[#1A1A18]'
              }`}
            >
              Semua
              {selectedCategory === '' && (
                <motion.span
                  layoutId="activeCategoryUnderline"
                  transition={TAB_SPRING}
                  className="absolute right-3 bottom-0 left-3 h-[1.5px] bg-[#1A1A18]"
                />
              )}
            </button>

            {categories.map((cat) => {
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`relative px-3 py-1.5 text-[12.5px] font-medium tracking-[-0.01em] transition-colors duration-200 ${
                    active ? 'text-[#1A1A18]' : 'text-[#63625C] hover:text-[#1A1A18]'
                  }`}
                >
                  {cat.name}
                  {active && (
                    <motion.span
                      layoutId="activeCategoryUnderline"
                      transition={TAB_SPRING}
                      className="absolute right-3 bottom-0 left-3 h-[1.5px] bg-[#1A1A18]"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Minimal Search Trigger, Admin Link, Monochrome Cart Button */}
        <div className="flex items-center gap-3 sm:gap-5">
          {showCatalogControls && onSearchChange && (
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Cari produk"
              className={`inline-flex items-center gap-1.5 py-1 text-[12.5px] transition-colors duration-200 ${
                searchOpen || search
                  ? 'text-[#1A1A18]'
                  : 'text-[#63625C] hover:text-[#1A1A18]'
              }`}
            >
              <Search className="h-4 w-4" strokeWidth={1.25} />
              <span className="hidden font-mono text-[11px] uppercase xl:inline">Cari</span>
            </button>
          )}

          <Link
            to="/admin"
            className="text-[12.5px] font-medium text-[#63625C] transition-colors duration-200 hover:text-[#1A1A18]"
          >
            Admin
          </Link>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={openCart}
            aria-label="Buka keranjang belanja"
            className={`inline-flex items-center gap-2 rounded-[2px] border px-3 py-1.5 font-mono text-[11.5px] font-medium tracking-[0.04em] transition-colors duration-250 ${
              totalItems > 0
                ? 'border-[#1A1A18] bg-[#1A1A18] text-[#F5F3EE] hover:bg-[#2F2F2C]'
                : 'border-[#1A1A18]/25 bg-transparent text-[#1A1A18] hover:border-[#1A1A18] hover:bg-[#1A1A18] hover:text-[#F5F3EE]'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.25} />
            <span className="hidden sm:inline">Keranjang</span>
            <span className="tabular-nums">[{totalItems}]</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Category Filter Strip */}
      {showCatalogControls && onSelectCategory && categories.length > 0 && (
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-[#1A1A18]/8 px-6 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className={`relative shrink-0 rounded-[2px] px-3 py-1 text-[12px] font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-[#1A1A18] text-[#F5F3EE]'
                : 'text-[#63625C] hover:text-[#1A1A18]'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`relative shrink-0 rounded-[2px] px-3 py-1 text-[12px] font-medium transition-colors ${
                  active
                    ? 'bg-[#1A1A18] text-[#F5F3EE]'
                    : 'text-[#63625C] hover:text-[#1A1A18]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Smooth Expandable Search Bar */}
      <AnimatePresence initial={false}>
        {showCatalogControls && onSearchChange && searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EXPO_OUT }}
            className="overflow-hidden border-t border-[#1A1A18]/10 bg-[#F5F3EE]/95"
          >
            <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-6 py-3 md:px-12 lg:px-16">
              <Search className="h-4 w-4 shrink-0 text-[#63625C]" strokeWidth={1.25} />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari objek berdasarkan nama..."
                aria-label="Cari produk berdasarkan nama"
                className="w-full bg-transparent text-[14px] text-[#1A1A18] placeholder:text-[#8D8B83] focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="font-mono text-[11px] text-[#63625C] uppercase hover:text-[#1A1A18]"
                >
                  Hapus
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseSearch}
                aria-label="Tutup pencarian"
                className="p-1 text-[#63625C] transition-colors hover:text-[#1A1A18]"
              >
                <X className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Soft Top Mist Feather When Scrolled */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute right-0 -bottom-6 left-0 h-6 bg-gradient-to-b from-[#F5F3EE]/70 via-[#F5F3EE]/20 to-transparent transition-opacity duration-350 ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </header>
  );
}
