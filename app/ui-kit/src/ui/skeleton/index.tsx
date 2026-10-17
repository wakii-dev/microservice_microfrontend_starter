// Skeleton — PrimeReact shimmer wave: gradient translate trái→phải 1.6s.
// Tailwind v4 @theme inline — KHÔNG dùng base.css (tránh syntax conflict).
import type { ReactNode } from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'row' | 'card' | 'circle' | 'button';
  count?: number;
  className?: string;
}

const VARIANT_CLS: Record<string, string> = {
  text: 'h-4 w-full rounded-[4px]',
  row: 'h-11 w-full rounded-[4px]',
  card: 'h-24 w-full rounded-xl',
  circle: 'size-10 rounded-full',
  button: 'h-8 w-20 rounded-lg',
};

function ShimmerBone({ variant }: { variant: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden bg-s3 ${VARIANT_CLS[variant] ?? VARIANT_CLS.row}`}
    >
      <span
        className="absolute inset-0 animate-[bp-shimmer-anim_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
    </span>
  );
}

export function Skeleton({ variant = 'text', count = 1, className }: SkeletonProps) {
  return (
    <div aria-busy="true" className={`flex flex-col gap-2 ${className ?? ''}`} role="status">
      {Array.from({ length: count }, (_, i) => (
        <ShimmerBone key={i} variant={variant} />
      ))}
    </div>
  );
}
