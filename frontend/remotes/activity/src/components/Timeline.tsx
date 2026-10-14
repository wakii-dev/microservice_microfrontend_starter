// Timeline feed nhóm theo ngày (SF-4, hand-off §4): heading ngày 12px --ink3 + rail dọc
// --line, entry = FeedItem (badge action + tên + task + time mono phải).
import type { ActivityFeedItem } from '../api';
import { FeedItem } from './FeedItem';
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
    <ol aria-label="Danh sách hoạt động" className="act-timeline">
      {groupByDay(items, now).map((group) => (
        <li key={group.key} className="act-timeline__day">
          <h3 className="act-timeline__day-heading">{group.heading}</h3>
          <ul className="act-timeline__group">
            {group.items.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
