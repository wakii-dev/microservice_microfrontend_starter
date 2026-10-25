// Toolbar — search theo tiêu đề (useDebounce 200ms — lọc client-side các card
// đã tải) + Segmented sort (mới nhất/cũ nhất) + nút "＋ Thêm" mở modal tạo +
// progress "n/N xong" (bar accent; n = done / tổng card).
import { Input, Segmented } from '@wakii/ui-kit';
import type { BoardSort } from './utils';

export interface ToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  sort: BoardSort;
  onSortChange: (sort: BoardSort) => void;
  done: number;
  total: number;
  onCreate: () => void;
}

export function Toolbar({ query, onQueryChange, sort, onSortChange, done, total, onCreate }: ToolbarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-s1 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          aria-label="Tìm kiếm task"
          placeholder="Tìm theo tiêu đề…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="min-w-0 flex-[1_1_180px]"
        />
        <Segmented
          ariaLabel="Sắp xếp"
          value={sort}
          onChange={(value) => onSortChange(value as BoardSort)}
          options={[
            { label: 'Mới nhất', value: 'newest' },
            { label: 'Cũ nhất', value: 'oldest' },
          ]}
        />
        <button
          type="button"
          onClick={onCreate}
          className="ml-auto inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-none bg-accent px-3.5 text-body font-medium text-white transition-[filter] hover:brightness-110 active:brightness-95"
        >
          <span aria-hidden="true" className="text-h3 leading-none">
            ＋
          </span>
          Thêm
        </button>
      </div>

      {/* Progress tổng — bar n/N xong */}
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Tiến độ hoàn thành"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-pill bg-s3"
        >
          <div
            className="h-full rounded-pill bg-st-done transition-[width] duration-500 ease-[var(--ease-smooth)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-meta tabular-nums text-ink2">
          {done}/{total} xong
        </span>
      </div>
    </div>
  );
}
