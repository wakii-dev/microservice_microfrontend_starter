// Feed item entry (SF-4, hand-off §4): «userName» + badge action + «taskTitle» đậm,
// time mono vi-VN bên phải. Dot màu action nằm trong Badge primitive (không thêm dot rail).
// User-display fields render TRỰC TIẾP từ response (spec slice mục 2 — không tự bịa placeholder).
import { Badge } from '@wakii-dev/ui-kit';
import type { BadgeVariant } from '@wakii-dev/ui-kit';
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
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 py-2 pl-4 max-md:pl-3">
      <span className="act-feed-item__main min-w-0">
        <strong className="font-semibold text-ink">{item.userName}</strong>{' '}
        {action ? (
          <Badge variant={action.variant}>{action.label}</Badge>
        ) : (
          // Unknown action: fallback nguyên văn (giữ hành vi hiện tại — spec slice mục 3)
          <span className="text-ink2">{item.action}</span>
        )}{' '}
        <strong className="font-semibold text-ink">{item.taskTitle}</strong>
      </span>
      <time className="whitespace-nowrap font-mono text-meta text-ink3" dateTime={item.timestamp}>
        {formatTime(item.timestamp)}
      </time>
    </li>
  );
}
