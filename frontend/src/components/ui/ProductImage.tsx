import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
}

export function ProductImage({ src, alt, className = '', imgClassName = '' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[#EAE7DF] text-[#9A978E] ${className}`}
        aria-label={alt}
      >
        <Package className="h-7 w-7" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#EAE7DF] ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#E3DFD6]" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
      />
    </div>
  );
}
