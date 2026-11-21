import type { ProductCardAspect } from './ProductCard';

interface ProductCardSkeletonProps {
  aspect?: ProductCardAspect;
}

const ASPECT_CLASSES: Record<ProductCardAspect, string> = {
  landscape: 'aspect-[4/3]',
  portrait: 'aspect-[3/4]',
  gallery: 'aspect-[4/5]',
};

export function ProductCardSkeleton({ aspect = 'gallery' }: ProductCardSkeletonProps) {
  return (
    <div className="flex flex-col">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="h-2.5 w-8 animate-pulse bg-[#E3DFD6]" />
        <div className="h-2.5 w-20 animate-pulse bg-[#EAE7DF]" />
      </div>
      <div className={`w-full animate-pulse rounded-xl bg-[#EAE7DF] ${ASPECT_CLASSES[aspect]}`} />
      <div className="mt-4">
        <div className="h-4 w-2/3 animate-pulse bg-[#E3DFD6]" />
        <div className="mt-2 h-3 w-5/6 animate-pulse bg-[#EAE7DF]" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#1A1A18]/10 pt-3">
        <div className="h-3.5 w-24 animate-pulse bg-[#E3DFD6]" />
        <div className="h-7 w-22 animate-pulse bg-[#EAE7DF]" />
      </div>
    </div>
  );
}
