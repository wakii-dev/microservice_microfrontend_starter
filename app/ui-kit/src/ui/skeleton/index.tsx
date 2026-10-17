// Skeleton — khối nền pulse, wrapper aria-busy (hand-off §3, SF-1).
// Shimmer opacity .5→1 1.2s; prefers-reduced-motion tắt (styles/base.css).
export interface SkeletonProps {
  variant: 'text' | 'row' | 'card';
  count?: number;
}

export function Skeleton({ variant, count = 1 }: SkeletonProps) {
  return (
    <div aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`bp-skeleton bp-skeleton--${variant}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
