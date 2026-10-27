// Timeline — compose từ **Timeline của @wakii/ui-kit** (redesign 2026-10-27):
// kit lo rail dọc + dot + spacing; màu dot per event type qua item.color
// (ACTION_DOT — mirror variant Badge, hand-off §3). Nhóm theo ngày GIỮ: ol
// ngoài mang aria-label "Danh sách hoạt động" (contract role list name — kit
// Timeline chưa nhận aria-label nên tên list đặt ở ol bọc ngoài), mỗi ngày
// heading h3 + 1 KitTimeline. Entry mới pop-in giữ motion (FeedItem).
import { Timeline as KitTimeline, type TimelineItem } from '@wakii/ui-kit';
import type { ActivityFeedItem } from '../api';
import { FeedItem, ACTION_DOT } from './FeedItem';
import { dayKey, formatDayHeading } from './time';

export interface DayGroup {
  /** key ngày local (ổn định cho React key) */
  key: string;
  heading: string;
  items: ActivityFeedItem[];
}

/** Gom items theo ngày LOCAL — GIỮ nguyên thứ tự feed (BE trả newest-first, không tự sort). */
export function groupByDay(items: ActivityFeedItem[], now: Date): DayGroup[] {
  const groups: DayGroup[] = [];
  const byKey = new Map<string, DayGroup>();
  for (const item of items) {
    const key = dayKey(item.timestamp);
    let group = byKey.get(key);
    if (!group) {
      group = { key, heading: formatDayHeading(item.timestamp, now), items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

export function Timeline({ items, now = new Date() }: { items: ActivityFeedItem[]; now?: Date }) {
  return (
    <ol aria-label="Danh sách hoạt động" className="m-0 grid list-none gap-6 p-0">
      {groupByDay(items, now).map((group) => (
        <li key={group.key} className="m-0 p-0">
          <h3 className="mb-2 text-meta font-semibold uppercase tracking-[0.04em] text-ink3">{group.heading}</h3>
          <KitTimeline
            items={group.items.map(
              (item): TimelineItem => ({
                key: item.id,
                color: ACTION_DOT[item.action] ?? 'var(--accent)',
                children: <FeedItem item={item} />,
              }),
            )}
          />
        </li>
      ))}
    </ol>
  );
}
