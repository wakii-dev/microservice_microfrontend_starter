// ActivityPage — expose `./ActivityPage` (registry conventions/08), shell mount vào route
// /activity (RequireAuth đã lo redirect login; 401 → error banner).
// SF-4 (story VU-53): redesign theo hand-off — stats grid StatTile + timeline feed
// (Badge primitive theo action), skeleton từng khu ĐỘC LẬP (Promise.allSettled giữ),
// EmptyState hướng dẫn sang Tasks, refresh busy state.
// Tokens import idempotent (:root custom props cùng giá trị — trong shell shell đã import,
// standalone có bản riêng qua standalone.tsx; trùng vô hại, kiến trúc hand-off §2).
import '@wakii/ui-kit/styles/tokens.css';
import './app.css'; // tailwind utilities (spec tailwind-migration)
import './styles.css';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, Skeleton, Spinner } from '@wakii/ui-kit';
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
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const loading = loadingFeed || loadingStats;

  const load = useCallback(async () => {
    setFeedError(null);
    setStatsError(null);
    setLoadingFeed(true);
    setLoadingStats(true);
    // feed + stats tải độc lập — stats fail không che mất feed (Promise.allSettled giữ)
    const feedPromise = fetchFeed()
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        setFeedError(describeError(err));
      })
      .finally(() => {
        setLoadingFeed(false);
      });
    const statsPromise = fetchStats()
      .then((res) => {
        setStats(res);
      })
      .catch((err: unknown) => {
        setStatsError(describeError(err));
        setStats(null);
      })
      .finally(() => {
        setLoadingStats(false);
      });
    await Promise.allSettled([feedPromise, statsPromise]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-label="Activity feed và thống kê" className="act-page">
      <header className="act-header">
        <h1>Activity</h1>
        <button type="button" className="act-refresh" disabled={loading} onClick={() => void load()}>
          {loading && <Spinner label="Đang tải activity" />}
          Làm mới
        </button>
      </header>

      <div aria-label="Thống kê tasks" className="act-stats">
        {statsError && (
          <p role="alert" className="error-banner act-stats__error">
            Stats: {statsError}
          </p>
        )}
        {loadingStats ? (
          <div className="act-stats-skeleton">
            <Skeleton variant="card" count={4} />
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

      {feedError && (
        <p role="alert" className="error-banner">
          {feedError}
        </p>
      )}

      <section aria-busy={loadingFeed} className="act-feed">
        <h2 className="act-feed__head">
          Feed ({items.length}/{total})
        </h2>
        {loadingFeed ? (
          <Skeleton variant="row" count={4} />
        ) : items.length === 0 && !feedError ? (
          <EmptyState
            action={<a className="act-link" href="/tasks">Đi tới Tasks</a>}
            description="Tạo một task ở trang Tasks để thấy event tại đây."
            title="Chưa có hoạt động nào"
          />
        ) : (
          items.length > 0 && <Timeline items={items} />
        )}
      </section>
    </section>
  );
}
export default ActivityPage;
