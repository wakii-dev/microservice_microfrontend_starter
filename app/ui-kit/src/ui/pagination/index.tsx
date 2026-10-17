// Pagination — antd look: item 32×32 rounded-2, current = nền accent trắng chữ,
// prev/next ‹ ›, ellipsis ••• (jump ±5 — antd quick). Contract note: TasksPage giữ
// "Tải thêm"/"x/total" — component này stories-only cho đến khi có page-based list.
import { useMemo } from 'react';

export interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange?: (page: number) => void;
  className?: string;
}

/** Dãy trang kiểu antd: 1 … p-1 p p+1 … N (window ±1, giữ đầu/cuối). */
export function pageList(current: number, pageCount: number): Array<number | 'ellipsis-prev' | 'ellipsis-next'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages: Array<number | 'ellipsis-prev' | 'ellipsis-next'> = [1];
  const lo = Math.max(2, current - 1);
  const hi = Math.min(pageCount - 1, current + 1);
  if (lo > 2) pages.push('ellipsis-prev');
  for (let p = lo; p <= hi; p++) pages.push(p);
  if (hi < pageCount - 1) pages.push('ellipsis-next');
  pages.push(pageCount);
  return pages;
}

const ITEM =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-2 border border-transparent px-2 text-body text-ink transition-colors hover:text-accent';

export function Pagination({ current, pageSize, total, onChange, className }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pages = useMemo(() => pageList(current, pageCount), [current, pageCount]);

  const go = (p: number) => {
    if (p < 1 || p > pageCount || p === current) return;
    onChange?.(p);
  };

  return (
    <nav aria-label="Phân trang" className={`flex items-center gap-2${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        aria-label="Trang trước"
        className={ITEM}
        disabled={current === 1}
        onClick={() => go(current - 1)}
      >
        ‹
      </button>
      {pages.map((p) =>
        p === 'ellipsis-prev' || p === 'ellipsis-next' ? (
          <button
            key={p}
            type="button"
            aria-label={p === 'ellipsis-prev' ? 'Lùi 5 trang' : 'Tiến 5 trang'}
            className={`${ITEM} tracking-[2px]`}
            onClick={() => go(p === 'ellipsis-prev' ? Math.max(1, current - 5) : Math.min(pageCount, current + 5))}
          >
            •••
          </button>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Trang ${p}`}
            aria-current={p === current ? 'page' : undefined}
            className={
              p === current
                ? 'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-2 border border-accent bg-s2 px-2 text-body text-accent'
                : `${ITEM}`
            }
            onClick={() => go(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Trang sau"
        className={ITEM}
        disabled={current === pageCount}
        onClick={() => go(current + 1)}
      >
        ›
      </button>
    </nav>
  );
}
