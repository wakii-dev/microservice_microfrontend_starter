// Feed item entry (SF-4, hand-off §4): «userName» + badge action + «taskTitle» đậm,
// time mono vi-VN bên phải. Dot màu action nằm trong Badge primitive (không thêm dot rail).
// User-display fields render TRỰC TIẾP từ response (spec slice mục 2 — không tự bịa placeholder).
import { Badge } from '@wakii/ui-kit';
import type { BadgeVariant } from '@wakii/ui-kit';
import type { ActivityFeedItem } from '../api';
import { formatTime } from './time';

/** action → badge variant + label (hand-off §3 mapping; label = ACTION_LABELS giữ nguyên văn). */
export const ACTION_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  'task.created': { label: 'đã tạo', variant: 'created' },
  'task.updated': { label: 'đã cập nhật', variant: 'updated' },
  'task.assigned': { label: 'đã giao', variant: 'assigned' },
  'task.deleted': { label: 'đã xoá', variant: 'deleted' },
  'task.assignment_failed': { label: 'gán thất bại', variant: 'assignmentFailed' },
};

export function FeedItem({ item }: { item: ActivityFeedItem }) {
  const action = ACTION_BADGE[item.action];
  return (
    <li className="act-feed-item">
      <span className="act-feed-item__main">
        <strong className="act-feed-item__actor">{item.userName}</strong>{' '}
        {action ? (
          <Badge variant={action.variant}>{action.label}</Badge>
        ) : (
          // Unknown action: fallback nguyên văn (giữ hành vi hiện tại — spec slice mục 3)
          <span className="act-feed-item__raw-action">{item.action}</span>
        )}{' '}
        <strong className="act-feed-item__task">{item.taskTitle}</strong>
      </span>
      <time className="act-feed-item__time" dateTime={item.timestamp}>
        {formatTime(item.timestamp)}
      </time>
    </li>
  );
}
