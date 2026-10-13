// ActivityPage — expose `./ActivityPage` (registry conventions/08), shell mount vào route /activity
// (RequireAuth đã lo redirect login; 401 → error banner).
import { useCallback, useEffect, useState } from 'react';
import { ActivityFeedItem, ActivityStats, ApiError, fetchFeed, fetchStats } from './api';

const ACTION_LABELS: Record<string, string> = {
  'task.created': 'đã tạo',
  'task.updated': 'đã cập nhật',
  'task.assigned': 'đã giao',
  'task.deleted': 'đã xoá',
  'task.assignment_failed': 'gán thất bại',
};

function formatTime(iso: string): string {
  // Hiển thị địa phương (demo boilerplate — không i18n library, out-of-scope epic)
  return new Date(iso).toLocaleString('vi-VN');
}

/**
 * Feed + stats theo spec slice mục 4: render user-display fields (userName, taskTitle)
 * TRỰC TIẾP từ response — không tự bịa placeholder. Stats lỗi → banner riêng, feed vẫn render.
 */
export function ActivityPage() {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFeedError(null);
    setStatsError(null);
    setLoading(true);
    // feed + stats tải độc lập — stats fail không che mất feed (go-svc stats 503 khi
    // mất quyền đọc readonly schema — contract activity.yaml)
    const feedPromise = fetchFeed()
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        setFeedError(describeError(err));
      });
    const statsPromise = fetchStats()
      .then((res) => {
        setStats(res);
      })
      .catch((err) => {
        setStatsError(describeError(err));
        setStats(null);
      });
    await Promise.allSettled([feedPromise, statsPromise]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function describeError(err: unknown): string {
    if (err instanceof ApiError) {
      return err.message;
    }
    return 'Không kết nối được dịch vụ activity.';
  }

  return (
    <section aria-label="Activity feed và thống kê">
      <h1>Activity</h1>

      <div aria-label="Thống kê tasks" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {statsError && (
          <p role="alert" className="error-banner">
            Stats: {statsError}
          </p>
        )}
        {stats && (
          <>
            <div
              aria-label="Tổng số task"
              style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.5rem 1rem' }}
            >
              <strong>{stats.totalTasks}</strong>
              <div>
                <small>Tổng task</small>
              </div>
            </div>
            {(
              [
                ['todo', 'Cần làm'],
                ['in_progress', 'Đang làm'],
                ['done', 'Xong'],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                aria-label={`Task ${label}`}
                style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.5rem 1rem' }}
              >
                <strong>{stats.tasksByStatus[key]}</strong>
                <div>
                  <small>{label}</small>
                </div>
              </div>
            ))}
            {stats.recentEvents !== undefined && (
              <div
                aria-label="Sự kiện 24h qua"
                style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.5rem 1rem' }}
              >
                <strong>{stats.recentEvents}</strong>
                <div>
                  <small>Sự kiện 24h qua</small>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {feedError && (
        <p role="alert" className="error-banner">
          {feedError}
        </p>
      )}

      <button type="button" onClick={() => void load()} style={{ margin: '0.75rem 0' }}>
        Làm mới
      </button>

      {loading ? (
        <p>Đang tải activity…</p>
      ) : items.length === 0 && !feedError ? (
        <p>Chưa có hoạt động nào — tạo một task ở trang Tasks để thấy event tại đây.</p>
      ) : (
        <>
          <h2>
            Feed ({items.length}/{total})
          </h2>
          <ul aria-label="Danh sách hoạt động" style={{ listStyle: 'none', padding: 0 }}>
            {items.map((item) => (
              <li key={item.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid #edf2f7' }}>
                <strong>{item.userName}</strong> {ACTION_LABELS[item.action] ?? item.action}{' '}
                <strong>{item.taskTitle}</strong>{' '}
                <small>
                  <time dateTime={item.timestamp}>{formatTime(item.timestamp)}</time>
                </small>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
export default ActivityPage;
