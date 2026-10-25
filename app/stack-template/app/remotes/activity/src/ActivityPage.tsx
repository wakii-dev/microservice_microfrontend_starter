// ActivityPage — expose `./ActivityPage` (registry conventions/08), shell mount vào route
// /activity (RequireAuth đã lo redirect login; 401 → error banner).
// SF-4 (story VU-53): redesign theo hand-off — stats grid StatTile + timeline feed
// (Badge primitive theo action), skeleton từng khu ĐỘC LẬP (Promise.allSettled giữ),
// EmptyState hướng dẫn sang Tasks, refresh busy state.
// Motion redesign (mission remotes): MotionConfig reducedMotion="user" toàn cây ·
// StatTile đếm số animate khi vào viewport (fallback tĩnh jsdom/reduced-motion) ·
// feed stagger + pop-in entry (Timeline/FeedItem) · live pulse dot cạnh heading Feed ·
// icon Làm mới quay khi đang fetch · skeleton↔feed fade mượt. framer-motion bundle
// LOCAL (KHÔNG trong shared: rspack).
// Tokens import idempotent (:root custom props cùng giá trị — trong shell shell đã import,
// standalone có bản riêng qua standalone.tsx; trùng vô hại, kiến trúc hand-off §2).
import '@wakii/ui-kit/styles/tokens.css';
import './app.css'; // tailwind utilities (spec tailwind-migration)
import { useQuery } from '@tanstack/react-query';
import { MotionConfig, motion } from 'motion/react';
import { useCallback } from 'react';
import { Alert, Button, EmptyState, Icon, Link, Skeleton, Spinner } from '@wakii/ui-kit';
import { ActivityFeedItem, ActivityStats, ApiError, fetchFeed, fetchStats } from './api';
import { StatTile } from './components/StatTile';
import { Timeline } from './components/Timeline';

/** Nhãn 3 trạng thái writable — aria-label ghép "Task <label>" GIỮ NGUYÊN VĂN (contract). */
const STATUS_TILES: ReadonlyArray<{ key: 'todo' | 'in_progress' | 'done'; label: string }> = [
  { key: 'todo', label: 'Cần làm' },
  { key: 'in_progress', label: 'Đang làm' },
  { key: 'done', label: 'Xong' },
];

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  return 'Không kết nối được dịch vụ activity.';
}

/**
 * Feed + stats theo spec slice: render user-display fields (userName, taskTitle) TRỰC TIẾP
 * từ response — không tự bịa placeholder. Hai khu tải ĐỘC LẬP: stats lỗi → banner riêng,
 * feed vẫn render (go-svc stats 503 khi mất quyền đọc readonly schema — contract activity.yaml).
 */
export function ActivityPage() {
  // 2 query ĐỘC LẬP (thay Promise.allSettled thủ công) — stats fail không che feed.
  // Query key 'activity/*' trên cache singleton MF: remote tasks invalidate ['activity']
  // sau mỗi mutation → feed/stats tự refetch (libs adopt 2026-10-17).
  const feedQuery = useQuery({ queryKey: ['activity', 'feed'], queryFn: fetchFeed });
  const statsQuery = useQuery({ queryKey: ['activity', 'stats'], queryFn: fetchStats });

  const items = feedQuery.data?.items ?? [];
  const total = feedQuery.data?.total ?? 0;
  const stats = statsQuery.data ?? null;
  const feedError = feedQuery.error ? describeError(feedQuery.error) : null;
  const statsError = statsQuery.error ? describeError(statsQuery.error) : null;
  const loadingFeed = feedQuery.isFetching; // refetch (Làm mới) cũng busy — mirror load() cũ
  const loadingStats = statsQuery.isFetching;
  const loading = loadingFeed || loadingStats;
  // Motion redesign: skeleton feed CHỈ khi chưa có data (lần đầu) — refetch giữ
  // list cũ trên màn (stale-while-revalidate) → entry mới từ invalidate(['activity'])
  // POP-IN trong Timeline thay vì cả khu nháy skeleton. Button Làm mới vẫn busy
  // đúng contract (loading = isFetching).
  const showFeedSkeleton = loadingFeed && items.length === 0 && !feedError;

  const load = useCallback(() => {
    void feedQuery.refetch();
    void statsQuery.refetch();
  }, [feedQuery, statsQuery]);

  return (
    // Motion redesign: reducedMotion="user" — mọi animation (pulse/quay/đếm số)
    // rơi về tức thì khi user tắt motion.
    <MotionConfig reducedMotion="user">
      <section aria-label="Activity feed và thống kê" className="grid gap-6 max-md:gap-4">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <h1 className="m-0 text-h1">Activity</h1>
          <Button
            type="default"
            disabled={loading}
            onClick={() => void load()}
            icon={
              // Motion redesign: icon quay đều khi đang fetch (Spinner giữ role=status
              // cho a11y contract — icon quay là lớp visual song song)
              <motion.span
                aria-hidden="true"
                className="inline-flex"
                animate={{ rotate: loading ? 360 : 0 }}
                transition={loading ? { repeat: Infinity, duration: 0.9, ease: 'linear' } : { duration: 0.25 }}
              >
                <Icon name="refresh" />
              </motion.span>
            }
          >
            {loading && <Spinner label="Đang tải activity" />}
            Làm mới
          </Button>
        </header>

        <div aria-label="Thống kê tasks" className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
          {statsError && (
            <Alert className="col-span-full" type="error" message={`Stats: ${statsError}`} />
          )}
          {loadingStats ? (
            <div className="col-span-full grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
              <Skeleton variant="card" count={4} className="[&>div]:grid [&>div]:gap-[inherit] [&>div]:grid-cols-[inherit]" />
            </div>
          ) : (
            stats && (
              <>
                <StatTile ariaLabel="Tổng số task" label="Tổng task" value={stats.totalTasks} />
                {STATUS_TILES.map(({ key, label }) => (
                  <StatTile
                    key={key}
                    ariaLabel={`Task ${label}`}
                    label={label}
                    value={stats.tasksByStatus[key]}
                  />
                ))}
                {stats.recentEvents !== undefined && (
                  <StatTile
                    ariaLabel="Sự kiện 24h qua"
                    label="Sự kiện 24h qua"
                    value={stats.recentEvents}
                  />
                )}
              </>
            )
          )}
        </div>

        {feedError && <Alert type="error" message={feedError} />}

        <section aria-busy={loadingFeed}>
          <h2 className="mb-3 flex items-center gap-2 text-h2 font-semibold text-ink">
            <span>Feed ({items.length}/{total})</span>
            {/* Live pulse dot — chỉ khi có dữ liệu (dot không có text → contract
             * getByText('Feed (…)') giữ nguyên) */}
            {items.length > 0 && !loadingFeed && (
              <motion.span
                aria-hidden="true"
                className="inline-block size-2 rounded-pill bg-st-done"
                animate={{ opacity: [1, 0.35, 1], scale: [1, 0.8, 1] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              />
            )}
          </h2>
          {/* Skeleton ↔ feed/empty swap: enter-fade mỗi nhánh (motion.div), KHÔNG
           * AnimatePresence exit ở page-level — nội dung mới có mặt NGAY khi data
           * tới (rOBUST với jsdom rAF throttle); refetch giữ list cũ (skeleton chỉ
           * khi chưa có data) → entry mới từ invalidate(['activity']) POP-IN trong
           * Timeline. Exit animation nằm ở item-level (FeedItem/TaskItem). */}
          {showFeedSkeleton ? (
            <motion.div
              key="feed-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Skeleton variant="row" count={4} />
            </motion.div>
          ) : items.length === 0 && !feedError ? (
            <motion.div
              key="feed-empty"
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Icon minh hoạ float nhẹ — keyframe bp-float kit; reduced-motion
               * global block tắt duration về 0.01ms */}
              <span
                aria-hidden="true"
                className="mb-1 text-ink3"
                style={{ animation: 'bp-float 3s ease-in-out infinite' }}
              >
                <Icon name="clock" size={36} />
              </span>
              <EmptyState
                action={
                  <Link href="/tasks">
                    Đi tới Tasks
                    <Icon name="arrow-right" size={12} />
                  </Link>
                }
                description="Tạo một task ở trang Tasks để thấy event tại đây."
                title="Chưa có hoạt động nào"
              />
            </motion.div>
          ) : (
            items.length > 0 && (
              <motion.div
                key="feed-list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Timeline items={items} />
              </motion.div>
            )
          )}
        </section>
      </section>
    </MotionConfig>
  );
}
export default ActivityPage;
