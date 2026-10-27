// FeedItem — entry content cho Timeline KIT (redesign compose-từ-kit 2026-10-27):
// kit Timeline render <li> + dot màu per action (item.color = token var) — file
// này chỉ render phần nhìn bên trong: «userName» + Badge action + «taskTitle»,
// time mono vi-VN bên phải. Entry MỚI pop-in GIỮ motion: motion.div khi mount
// (initial → animate); MotionConfig reducedMotion="user" ở page ràng buộc.
// Badge GIỮ thay Tag: Tag không variant — mất mapping màu per-action
// (created=accent, deleted=ink3, assignmentFailed=st-fail…) mà tests khóa
// contract dot-var. User-display fields render TRỰC TIẾP từ response.
import { motion } from 'motion/react';
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

/** action → màu dot trên rail Timeline kit (mirror variant Badge — hand-off §3). */
export const ACTION_DOT: Record<string, string> = {
  'task.created': 'var(--accent)',
  'task.updated': 'var(--st-doing)',
  'task.assigned': 'var(--accent-hi)',
  'task.deleted': 'var(--ink3)',
  'task.assignment_failed': 'var(--st-fail)',
};

export function FeedItem({ item }: { item: ActivityFeedItem }) {
  const action = ACTION_BADGE[item.action];
  return (
    // pop-in khi entry mount (event mới tới qua invalidate ['activity']) — exit
    // animation không còn (kit Timeline tự render li, không AnimatePresence).
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2"
    >
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
    </motion.div>
  );
}
