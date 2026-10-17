// StatusBadge — bọc primitive Badge (fe-shared, đóng băng props API) để giữ nguyên
// accessible name contract "Trạng thái task <title>" trên role="status" (context pack
// boundary: KHÔNG đổi aria-label bộ tasks). Text label nguyên văn qua children.
import { Badge } from '@boilerplate/fe-shared';
import type { TaskStatusExtended } from '../api';
import { STATUS_LABELS, STATUS_VARIANTS } from './status';

interface StatusBadgeProps {
  title: string;
  status: TaskStatusExtended;
}

export function StatusBadge({ title, status }: StatusBadgeProps) {
  return (
    <span role="status" aria-label={`Trạng thái task ${title}`} className="tsk-item__badge">
      <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
    </span>
  );
}
