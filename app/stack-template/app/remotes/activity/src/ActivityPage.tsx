// ActivityPage — expose `./ActivityPage` (registry conventions/08), shell mount vào route
// /activity (RequireAuth đã lo redirect login; 401 → error banner).
// SF-4 (story VU-53): redesign theo hand-off — stats grid StatTile + timeline feed
// (Badge primitive theo action), skeleton từng khu ĐỘC LẬP (Promise.allSettled giữ),
// EmptyState hướng dẫn sang Tasks, refresh busy state.
// Tokens import idempotent (:root custom props cùng giá trị — trong shell shell đã import,
// standalone có bản riêng qua standalone.tsx; trùng vô hại, kiến trúc hand-off §2).
import '@wakii/ui-kit/styles/tokens.css';
import './app.css'; // tailwind utilities (spec tailwind-migration)
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Alert, Button, EmptyState, Icon, Link, Reveal, Skeleton, Spinner } from '@wakii/ui-kit';
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

  const load = useCallback(() => {
    void feedQuery.refetch();
    void statsQuery.refetch();
  }, [feedQuery, statsQuery]);

  return (
    <section aria-label="Activity feed và thống kê" className="grid gap-6 max-md:gap-4">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="m-0 text-h1">Activity</h1>
        <Button
          type="default"
          disabled={loading}
          onClick={() => void load()}
          icon={loading ? undefined : <Icon name="refresh" />}
        >
          {loading && <Spinner label="Đang tải activity" />}
          Làm mới
        </Button>
      </header>

      {/* Motion pass tiết chế (mission #8): Reveal wrap NGOÀI stats grid + feed
       * (feed MỘT wrap cho cả nhóm — không từng item); 0 đổi logic/data flow.
       * jsdom không IO → Reveal fallback hiện luôn, tests không ảnh hưởng. */}
      <Reveal direction="up" delay={80}>
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
      </Reveal>

      {feedError && <Alert type="error" message={feedError} />}

      <section aria-busy={loadingFeed}>
        <h2 className="mb-3 text-h2 font-semibold text-ink">
          Feed ({items.length}/{total})
        </h2>
        {loadingFeed ? (
          <Skeleton variant="row" count={4} />
        ) : items.length === 0 && !feedError ? (
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
        ) : (
          items.length > 0 && (
            <Reveal direction="up" delay={120}>
              <Timeline items={items} />
            </Reveal>
          )
        )}
      </section>
    </section>
  );
}
export default ActivityPage;
