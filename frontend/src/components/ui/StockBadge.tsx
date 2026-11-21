interface StockBadgeProps {
  stock: number;
  variant?: 'inline' | 'pill';
}

export function StockBadge({ stock, variant = 'inline' }: StockBadgeProps) {
  if (variant === 'pill') {
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center border border-[#A1483F]/30 bg-[#F2E1DF] px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.06em] text-[#A1483F] uppercase">
          HABIS
        </span>
      );
    }
    if (stock <= 5) {
      return (
        <span className="inline-flex items-center border border-[#96662E]/30 bg-[#F2E7D8] px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.06em] text-[#96662E] uppercase">
          SISA {stock}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center border border-[#4A6B53]/25 bg-[#E4ECE5] px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.06em] text-[#3A5641] uppercase">
        {stock} UNIT
      </span>
    );
  }

  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-[#A1483F] uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-[#A1483F]" />
        HABIS
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-[#96662E] uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-[#96662E]" />
        SISA {stock}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.04em] text-[#63625C] uppercase tabular-nums">
      <span className="h-1.5 w-1.5 rounded-full bg-[#4A6B53]" />
      STOK {stock}
    </span>
  );
}
