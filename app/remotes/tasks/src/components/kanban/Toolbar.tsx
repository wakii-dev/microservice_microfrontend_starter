// Toolbar — 100% compose từ kit (redesign 2026-10-27): Input.Search (type=search
// → role searchbox, debounce ở page) · Segmented sort · Button "Thêm" (thay
// button tay) · Progress kit (thay progressbar tay — valuenow là % chuẩn WAI;
// text "n/N xong" render cạnh giữ contract đọc).
import { Button, Input, Progress, Segmented } from '@wakii/ui-kit';
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
        <Input.Search
          type="search"
          aria-label="Tìm kiếm task"
          placeholder="Tìm theo tiêu đề…"
          allowClear
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
        <Button type="primary" icon={<span aria-hidden="true">＋</span>} onClick={onCreate} className="ml-auto">
          Thêm
        </Button>
      </div>

      {/* Progress tổng — valuenow = % chuẩn WAI (kit Progress không nhận raw n/N);
       * text "n/N xong" là contract đọc của user — render cạnh bar. */}
      <div className="flex items-center gap-3">
        <Progress percent={pct} showInfo={false} className="min-w-0 flex-1" />
        <span className="whitespace-nowrap text-meta tabular-nums text-ink2">
          {done}/{total} xong
        </span>
      </div>
    </div>
  );
}
