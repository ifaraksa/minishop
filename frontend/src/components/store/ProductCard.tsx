import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../types';
import { formatRupiah } from '../../utils/format';
import { EXPO_OUT } from '../../utils/motion';
import { ProductImage } from '../ui/ProductImage';

export type ProductCardAspect = 'landscape' | 'portrait' | 'gallery';

interface ProductCardProps {
  product: Product;
  catalogIndex: number;
  aspect?: ProductCardAspect;
  staggerIndex?: number;
}

const ASPECT_CLASSES: Record<ProductCardAspect, string> = {
  landscape: 'aspect-[4/3]',
  portrait: 'aspect-[3/4]',
  gallery: 'aspect-[4/5]',
};

export function ProductCard({
  product,
  catalogIndex,
  aspect = 'gallery',
  staggerIndex = 0,
}: ProductCardProps) {
  const { getItemQuantity, addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<number | null>(null);

  const cartQty = getItemQuantity(product.id);
  const isOutOfStock = product.stock <= 0;
  const reachedStockLimit = cartQty >= product.stock;
  const indexLabel = String(catalogIndex + 1).padStart(2, '0');

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleAddClick = () => {
    if (isOutOfStock || reachedStockLimit) return;
    const added = addItem(product, 1);
    if (added) {
      setJustAdded(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setJustAdded(false);
      }, 1200);
    }
  };

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.7,
        delay: Math.min(staggerIndex, 3) * 0.06,
        ease: EXPO_OUT,
      }}
      className="group flex flex-col"
    >
      {/* 1. Top Meta Bar */}
      <div className="mb-2.5 flex items-center justify-between gap-2 font-mono text-[11px] tracking-[0.06em] text-[#63625C] uppercase">
        <span className="tabular-nums">{indexLabel}</span>
        <div className="flex items-center gap-2.5">
          {isOutOfStock ? (
            <span className="text-[#A1483F]">HABIS</span>
          ) : product.stock <= 5 ? (
            <span className="text-[#96662E]">SISA {product.stock}</span>
          ) : null}
          <span>{product.category?.name ?? 'OBJEK'}</span>
        </div>
      </div>

      {/* 2. Image Frame (soft tactile rounded-xl frame, silky 700ms inner zoom) */}
      <Link
        to={`/products/${product.id}`}
        state={{ product }}
        className={`relative block w-full overflow-hidden rounded-xl bg-[#EAE7DF] ${ASPECT_CLASSES[aspect]}`}
      >
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="h-full w-full"
          imgClassName={`transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 ${
            isOutOfStock ? 'opacity-50 grayscale-[55%]' : ''
          }`}
        />
      </Link>

      {/* 3. Info Block */}
      <div className="mt-4">
        <Link to={`/products/${product.id}`} state={{ product }} className="block">
          <h3 className="inline text-[15.5px] font-medium tracking-[-0.015em] text-[#1A1A18]">
            <span className="editorial-link">{product.name}</span>
          </h3>
          <p className="mt-1 line-clamp-1 text-[13px] leading-[1.5] text-[#63625C]">
            {product.description || 'Kebutuhan esensial pilihan untuk keseharian.'}
          </p>
        </Link>
      </div>

      {/* 4. Hairline Action Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1A1A18]/10 pt-3">
        <span className="font-mono text-[13px] font-medium text-[#1A1A18] tabular-nums">
          {formatRupiah(product.price)}
        </span>

        {isOutOfStock ? (
          <span className="font-mono text-[11px] tracking-[0.06em] text-[#A1483F] uppercase">
            Stok Habis
          </span>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={reachedStockLimit && !justAdded}
            onClick={handleAddClick}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[12px] font-medium tracking-[0.02em] transition-colors duration-250 ${
              justAdded
                ? 'border-[#4A6B53] bg-[#4A6B53] text-[#F5F3EE]'
                : reachedStockLimit
                  ? 'cursor-not-allowed border-[#1A1A18]/15 text-[#8D8B83]'
                  : 'border-[#1A1A18]/25 bg-transparent text-[#1A1A18] hover:border-[#1A1A18] hover:bg-[#1A1A18] hover:text-[#F5F3EE]'
            }`}
          >
            {justAdded ? (
              <>
                <span>Ditambahkan</span>
                <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
              </>
            ) : reachedStockLimit ? (
              <span className="font-mono text-[11px]">Maks. ({cartQty})</span>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" strokeWidth={1.25} />
                <span>Tambah{cartQty > 0 ? ` (${cartQty})` : ''}</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.article>
  );
}
