// StatusSelect — chỉ 3 writable status (assignment_failed KHÔNG ở đây — PATCH cấm);
// disabled khi per-item busy đang bay (spec slice #3).
// Tier 3 ui-kit: dùng Select component (combobox a11y — thay <select> native).
import { Select } from '@wakii/ui-kit';
import type { Task, TaskStatus } from '../api';
import { STATUS_LABELS, WRITABLE_STATUSES } from './status';

interface StatusSelectProps {
  task: Pick<Task, 'title' | 'status'>;
  disabled?: boolean;
  onChange: (status: TaskStatus) => void;
}

const OPTIONS = WRITABLE_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }));

export function StatusSelect({ task, disabled, onChange }: StatusSelectProps) {
  return (
    <Select
      className="min-w-[120px]"
      ariaLabel={`Trạng thái task ${task.title}`}
      value={task.status}
      options={OPTIONS}
      disabled={disabled}
      onChange={(value) => onChange(value as TaskStatus)}
    />
  );
}
