// StatusSelect — chỉ 3 writable status (assignment_failed KHÔNG ở đây — PATCH cấm);
// disabled khi per-item busy đang bay (spec slice #3).
import type { Task, TaskStatus } from '../api';
import { STATUS_LABELS, WRITABLE_STATUSES } from './status';

interface StatusSelectProps {
  task: Pick<Task, 'title' | 'status'>;
  disabled?: boolean;
  onChange: (status: TaskStatus) => void;
}

export function StatusSelect({ task, disabled, onChange }: StatusSelectProps) {
  return (
    <select
      className="tsk-item__select"
      aria-label={`Trạng thái task ${task.title}`}
      value={task.status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
    >
      {WRITABLE_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
