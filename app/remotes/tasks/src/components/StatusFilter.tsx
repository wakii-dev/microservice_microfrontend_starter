// StatusFilter — bộ lọc trạng thái motion redesign: indicator nền trượt layoutId
// giữa các nút (spring — motion redesign mission). GIỮ contract test: nút name
// "Tất cả"/"Cần làm"/"Đang làm"/"Xong" + role=group "Lọc theo trạng thái".
// Thay Tag.Checkable (chip tĩnh) — chọn vẫn set statusFilter → queryKey đổi →
// fetch mới tự động (logic nằm ở TasksPage, không đổi).
import { motion } from 'motion/react';
import { STATUS_LABELS, WRITABLE_STATUSES } from './status';
import type { TaskStatus } from '../api';

interface StatusFilterOption {
  value: TaskStatus | null;
  label: string;
}

const OPTIONS: StatusFilterOption[] = [
  { value: null, label: 'Tất cả' },
  ...WRITABLE_STATUSES.map((status) => ({ value: status as TaskStatus | null, label: STATUS_LABELS[status] })),
];

interface StatusFilterProps {
  value: TaskStatus | null;
  onChange: (value: TaskStatus | null) => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div
      role="group"
      aria-label="Lọc theo trạng thái"
      className="inline-flex flex-wrap gap-1 rounded-pill border border-line bg-s2 p-1"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`relative cursor-pointer rounded-pill border-none bg-transparent px-3 py-1 text-label transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              active ? 'text-ink' : 'text-ink2 hover:text-ink'
            }`}
          >
            {/* Indicator nền trượt — layoutId dùng chung 1 pill, spring di chuyển
             * giữa các nút khi filter đổi (motion redesign yêu cầu layoutId) */}
            {active && (
              <motion.span
                layoutId="tsk-filter-pill"
                aria-hidden="true"
                className="absolute inset-0 rounded-pill bg-accent/10"
                transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
