// Skeleton — PrimeReact shimmer wave: gradient translate trái→phải 1.6s.
// Tailwind v4 @theme inline — KHÔNG dùng base.css (tránh syntax conflict).

/** classNames sub-part slots (antd v5 style) — merge SAU default classes. */
export interface SkeletonClassNames {
  /** Root div `role="status"`. */
  wrapper?: string;
  /** Từng bone shimmer (`span[aria-hidden]`). */
  bone?: string;
}

export interface SkeletonProps {
  /** Hình khối bone: text/row/card/circle/button. */
  variant?: 'text' | 'row' | 'card' | 'circle' | 'button';
  /** Số bone render liên tiếp. */
  count?: number;
  /** classNames sub-part slots (antd v5) — merge SAU default. */
  classNames?: SkeletonClassNames;
  className?: string;
}

const VARIANT_CLS: Record<string, string> = {
  text: 'h-4 w-full rounded-1',
  row: 'h-11 w-full rounded-1',
  card: 'h-24 w-full rounded-xl',
  circle: 'size-10 rounded-pill',
  button: 'h-8 w-20 rounded-lg',
};

function ShimmerBone({ variant, className }: { variant: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden bg-s3 ${VARIANT_CLS[variant] ?? VARIANT_CLS.row}${className ? ` ${className}` : ''}`}
    >
      <span
        className="absolute inset-0 animate-[bp-shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
    </span>
  );
}

export function Skeleton({ variant = 'text', count = 1, classNames, className }: SkeletonProps) {
  return (
    <div
      aria-busy="true"
      role="status"
      className={`flex flex-col gap-2 ${className ?? ''}${classNames?.wrapper ? ` ${classNames.wrapper}` : ''}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <ShimmerBone key={i} variant={variant} className={classNames?.bone} />
      ))}
    </div>
  );
}
