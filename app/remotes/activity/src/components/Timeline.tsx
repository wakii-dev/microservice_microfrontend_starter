// Timeline feed nhóm theo ngày (SF-4, hand-off §4): heading ngày 12px --ink3 + rail dọc
// --line, entry = FeedItem (badge action + tên + task + time mono phải).
// Motion redesign: stagger 2 tầng qua variants propagation — ol animate "show" →
// day-li (delay theo thứ tự ngày + staggerChildren) → entry-li (FeedItem) xuất hiện
// lần lượt; entries nằm trong AnimatePresence → entry MỚI (event tới realtime qua
// invalidate ['activity']) pop-in, entry biến mất fade-out.
import { AnimatePresence, motion } from 'motion/react';
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

/** Day group: fade+y vào (delay theo ngày) + stagger con entries. */
const dayVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (dayIndex: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: dayIndex * 0.06, duration: 0.3, ease: 'easeOut' as const, staggerChildren: 0.045 },
  }),
};

export function Timeline({ items, now = new Date() }: { items: ActivityFeedItem[]; now?: Date }) {
  return (
    <motion.ol
      aria-label="Danh sách hoạt động"
      className="m-0 grid list-none gap-6 p-0"
      initial="hidden"
      animate="show"
    >
      {groupByDay(items, now).map((group, dayIndex) => (
        <motion.li key={group.key} className="act-timeline__day" variants={dayVariants} custom={dayIndex}>
          <h3 className="mb-2 text-meta font-semibold uppercase tracking-[0.04em] text-ink3">{group.heading}</h3>
          <ul className="relative m-0 list-none p-0 before:absolute before:bottom-3 before:left-[calc(var(--sp-4)+11px)] before:top-3 before:w-px before:bg-line before:content-[''] max-md:before:left-[calc(var(--sp-3)+11px)]">
            <AnimatePresence>
              {group.items.map((item) => (
                <FeedItem key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </ul>
        </motion.li>
      ))}
    </motion.ol>
  );
}
