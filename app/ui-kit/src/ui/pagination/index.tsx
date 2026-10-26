// Pagination — antd look: item ô vuông 32px (h-8 min-w-8) rounded-lg, KHÔNG chọn
// = viền outline (border-line) để nút đọc rõ; active = nền accent đặc + chữ trắng
// font-medium (fontWeightStrong) không viền; hover item thường/prev/next = bg-s3
// (colorBgTextHover); prev/next SVG chevron, ellipsis ··· (jump ±5 — antd quick);
// disabled = text-ink3 cursor-not-allowed, không hover bg, không viền.
// Contract note: TasksPage giữ "Tải thêm"/"x/total" — component này stories-only
// cho đến khi có page-based list.
import classNames from 'classnames';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from '../icons/index.js';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface PaginationClassNames {
  /** <nav> gốc bọc dãy trang. */
  root?: string;
  /** Button trang/prev/next/ellipsis (áp cả active/disabled). */
  item?: string;
}

export interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange?: (page: number) => void;
  className?: string;
  /** Inline style — passthrough lên nav gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: PaginationClassNames;
}

/** Dãy trang kiểu antd: 1 … p-1 p p+1 … N (window ±1, giữ đầu/cuối). */
// eslint-disable-next-line react-refresh/only-export-components
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

function ChevronLeftIcon() {
  return <Icon name="chevron-left" size={14} />;
}
function ChevronRightIcon() {
  return <Icon name="chevron-right" size={14} />;
}

const ITEM =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-transparent px-2 text-body text-ink transition-all duration-150 hover:bg-s3 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';
const ITEM_ACTIVE =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border-none bg-accent px-2 text-body font-medium text-white transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-white/60';
const ITEM_DISABLED =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border-none bg-transparent px-2 text-body text-ink3 cursor-not-allowed';

export function Pagination(props: PaginationProps) {
  const { current, pageSize, total, onChange, className, style } = props;
  const slots = props.classNames;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pages = useMemo(() => pageList(current, pageCount), [current, pageCount]);

  const go = (p: number) => {
    if (p < 1 || p > pageCount || p === current) return;
    onChange?.(p);
  };

  return (
    <nav
      aria-label="Phân trang"
      className={classNames('flex items-center gap-2', slots?.root, className)}
      style={style}
    >
      <button
        type="button"
        aria-label="Trang trước"
        className={classNames(current === 1 ? ITEM_DISABLED : ITEM, slots?.item)}
        disabled={current === 1}
        onClick={() => go(current - 1)}
      >
        <ChevronLeftIcon />
      </button>
      {pages.map((p) =>
        p === 'ellipsis-prev' || p === 'ellipsis-next' ? (
          <button
            key={p}
            type="button"
            aria-label={p === 'ellipsis-prev' ? 'Lùi 5 trang' : 'Tiến 5 trang'}
            className={classNames(ITEM, 'tracking-[2px]', slots?.item)}
            onClick={() => go(p === 'ellipsis-prev' ? Math.max(1, current - 5) : Math.min(pageCount, current + 5))}
          >
            ···
          </button>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Trang ${p}`}
            aria-current={p === current ? 'page' : undefined}
            className={classNames(p === current ? ITEM_ACTIVE : ITEM, slots?.item)}
            onClick={() => go(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Trang sau"
        className={classNames(current === pageCount ? ITEM_DISABLED : ITEM, slots?.item)}
        disabled={current === pageCount}
        onClick={() => go(current + 1)}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
}
