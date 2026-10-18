// StatusBadge — bọc Badge (ui-kit) thay Tag: Badge có variant màu theo status
// (todo/doing/done/failed — semantics màu GIỮ NGUYÊN), Tag là chip trung tính không
// variant. Wrapper giữ accessible name contract "Trạng thái task <title>" trên
// role="status" (context pack boundary: KHÔNG đổi aria-label bộ tasks).
import { Badge } from '@wakii/ui-kit';
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
