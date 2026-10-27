// Component tests SF-4 — mock api layer: timeline nhóm ngày, badge variant theo action,
// stats grid giữ NGUYÊN bộ aria-label (contract), skeleton từng khu độc lập
// (Promise.allSettled), refresh busy, empty state, unknown-action nguyên văn.
import { render, screen, waitFor, within } from '@testing-library/react';
import { createWrapper } from './test-utils';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityPage } from '../src/ActivityPage';
import { dayKey, formatDayHeading, formatTime } from '../src/components/time';
import * as api from '../src/api';

vi.mock('../src/api', async () => {
  const actual = await vi.importActual<typeof api>('../src/api');
  return {
    ...actual,
    fetchFeed: vi.fn(),
    fetchStats: vi.fn(),
  };
});

const mockedApi = vi.mocked(api);

const ITEM: api.ActivityFeedItem = {
  id: 'e1',
  taskId: 't1',
  userId: 'u1',
  action: 'task.created',
  timestamp: '2026-10-12T10:00:00Z',
  userName: 'Alice Nguyễn',
  taskTitle: 'Task A',
};

const STATS: api.ActivityStats = {
  totalTasks: 7,
  tasksByStatus: { todo: 3, in_progress: 2, done: 2, assignment_failed: 0 },
  recentEvents: 4,
};

function mockFeed(items: api.ActivityFeedItem[] = [ITEM]) {
  mockedApi.fetchFeed.mockResolvedValue({ items, total: items.length });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFeed();
  mockedApi.fetchStats.mockResolvedValue(STATS);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ActivityPage', () => {
  it('render feed với user-display fields từ response (userName + taskTitle)', async () => {
    render(<ActivityPage />, { wrapper: createWrapper() });
    // Cả hai field render trực tiếp từ response — không placeholder
    expect(await screen.findByText('Alice Nguyễn')).toBeInTheDocument();
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText(/đã tạo/)).toBeInTheDocument();
    expect(screen.getByText('Feed (1/1)')).toBeInTheDocument();
  });

  it('badge variant theo action — dot var --_dot theo variant (Tailwind migration 2026-10-17)', async () => {
    mockFeed([
      { ...ITEM, id: 'b1', action: 'task.created' },
      { ...ITEM, id: 'b2', action: 'task.updated' },
      { ...ITEM, id: 'b3', action: 'task.assigned' },
      { ...ITEM, id: 'b4', action: 'task.deleted' },
      { ...ITEM, id: 'b5', action: 'task.assignment_failed' },
    ]);
    render(<ActivityPage />, { wrapper: createWrapper() });
    const list = await screen.findByRole('list', { name: 'Danh sách hoạt động' });
    // Badge variants map → utility [--_dot:var(--…)] (badge container class chứa var đó)
    for (const dotVar of ['--accent', '--st-doing', '--accent-hi', '--ink3', '--st-fail']) {
      expect(list.querySelector(`[class*="[--_dot:var(${dotVar})]"]`)).toBeInTheDocument();
    }
  });

  it('action label MỚI (SF-3): task.assigned + task.assignment_failed render label tiếng Việt', async () => {
    mockFeed([
      { ...ITEM, id: 'e2', action: 'task.assigned' },
      { ...ITEM, id: 'e3', action: 'task.assignment_failed' },
    ]);
    render(<ActivityPage />, { wrapper: createWrapper() });
    expect(await screen.findByText(/đã giao/)).toBeInTheDocument();
    expect(screen.getByText(/gán thất bại/)).toBeInTheDocument();
  });

  it('action lạ ngoài labels → render nguyên văn, KHÔNG badge (không bịa placeholder)', async () => {
    mockFeed([{ ...ITEM, id: 'e4', action: 'task.whatever' }]);
    render(<ActivityPage />, { wrapper: createWrapper() });
    const list = await screen.findByRole('list', { name: 'Danh sách hoạt động' });
    expect(within(list).getByText('task.whatever')).toBeInTheDocument();
    expect(list.querySelector('.bp-badge')).toBeNull();
  });

  it('render stats tiles — GIỮ NGUYÊN bộ aria-label contract (CountUp kit animate → chờ textContent đích)', async () => {
    render(<ActivityPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Thống kê tasks')).toBeInTheDocument();
    await screen.findByLabelText('Tổng số task');
    // CountUp kit rAF 0.5s (redesign compose-từ-kit) — đếm 0 → giá trị đích
    await waitFor(() => expect(screen.getByLabelText('Tổng số task')).toHaveTextContent('7'), { timeout: 3000 });
    await waitFor(() => expect(screen.getByLabelText('Task Cần làm')).toHaveTextContent('3'), { timeout: 3000 });
    await waitFor(() => expect(screen.getByLabelText('Task Đang làm')).toHaveTextContent('2'), { timeout: 3000 });
    await waitFor(() => expect(screen.getByLabelText('Task Xong')).toHaveTextContent('2'), { timeout: 3000 });
    await waitFor(() => expect(screen.getByLabelText('Sự kiện 24h qua')).toHaveTextContent('4'), { timeout: 3000 });
  });

  it('stats fail → banner riêng, feed VẪN render (Promise.allSettled)', async () => {
    mockedApi.fetchStats.mockRejectedValue(
      new api.ApiError(503, {
        error: { code: 'READONLY_UNAVAILABLE', message: 'Không đọc được schema tasks', requestId: 'r1', details: null },
      }),
    );
    render(<ActivityPage />, { wrapper: createWrapper() });
    expect(await screen.findByText(/Không đọc được schema tasks/)).toBeInTheDocument();
    expect(screen.getByText('Alice Nguyễn')).toBeInTheDocument();
  });

  it('feed fail → banner role=alert với message từ envelope', async () => {
    mockedApi.fetchFeed.mockRejectedValue(
      new api.ApiError(401, {
        error: { code: 'UNAUTHORIZED', message: 'Token hết hạn', requestId: 'r2', details: null },
      }),
    );
    render(<ActivityPage />, { wrapper: createWrapper() });
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Token hết hạn/)).toBeInTheDocument();
  });

  it('feed rỗng → EmptyState gợi ý sang Tasks (link /tasks)', async () => {
    mockFeed([]);
    render(<ActivityPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Chưa có hoạt động nào')).toBeInTheDocument();
    expect(screen.getByText(/Tạo một task ở trang Tasks/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đi tới Tasks' })).toHaveAttribute('href', '/tasks');
  });

  it('nút Làm mới → gọi lại cả feed + stats', async () => {
    const user = userEvent.setup();
    render(<ActivityPage />, { wrapper: createWrapper() });
    await screen.findByText('Alice Nguyễn');
    await user.click(screen.getByRole('button', { name: /Làm mới/ }));
    await waitFor(() => expect(mockedApi.fetchFeed).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockedApi.fetchStats).toHaveBeenCalledTimes(2));
  });

  // ── SF-4 mới ──────────────────────────────────────────────────────────────

  it('timeline nhóm theo ngày — Hôm nay / Hôm qua / ngày khác, theo thứ tự feed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-14T09:00:00+07:00'));
    const now = new Date();
    const todayIso = now.toISOString();
    const yesterdayIso = new Date(now.getTime() - 86_400_000).toISOString();
    mockFeed([
      { ...ITEM, id: 'd1', timestamp: todayIso },
      { ...ITEM, id: 'd2', timestamp: todayIso },
      { ...ITEM, id: 'd3', timestamp: yesterdayIso },
      { ...ITEM, id: 'd4', timestamp: '2026-10-12T10:00:00Z' },
    ]);
    render(<ActivityPage />, { wrapper: createWrapper() });
    const list = await screen.findByRole('list', { name: 'Danh sách hoạt động' });
    const headings = within(list)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual(['Hôm nay', 'Hôm qua', expect.stringMatching(/12 tháng 10/)]);
  });

  it('entry: time vi-VN + dateTime giữ ISO gốc', async () => {
    render(<ActivityPage />, { wrapper: createWrapper() });
    const list = await screen.findByRole('list', { name: 'Danh sách hoạt động' });
    const time = list.querySelector('time');
    expect(time).not.toBeNull();
    expect(time).toHaveAttribute('dateTime', ITEM.timestamp);
    expect(time).toHaveTextContent(formatTime(ITEM.timestamp));
  });

  it('stats đang tải → skeleton trong khu stats, feed VẪN render (independence)', async () => {
    let resolveStats!: (s: api.ActivityStats) => void;
    mockedApi.fetchStats.mockImplementation(
      () => new Promise<api.ActivityStats>((res) => { resolveStats = res; }),
    );
    render(<ActivityPage />, { wrapper: createWrapper() });
    // feed xong trước — timeline render
    const feed = await screen.findByRole('list', { name: 'Danh sách hoạt động' });
    expect(feed).toBeInTheDocument();
    // stats khu vẫn skeleton — chưa có tile
    const statsArea = screen.getByLabelText('Thống kê tasks');
    expect(statsArea.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tổng số task')).not.toBeInTheDocument();
    resolveStats(STATS);
    await screen.findByLabelText('Tổng số task');
    expect(screen.getByLabelText('Thống kê tasks').querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('feed đang tải → skeleton trong khu feed, stats VẪN render (independence)', async () => {
    let resolveFeed!: (f: api.ActivityFeed) => void;
    mockedApi.fetchFeed.mockImplementation(
      () => new Promise<api.ActivityFeed>((res) => { resolveFeed = res; }),
    );
    render(<ActivityPage />, { wrapper: createWrapper() });
    // stats xong trước — tiles render
    expect(await screen.findByLabelText('Tổng số task')).toBeInTheDocument();
    // feed khu vẫn skeleton — chưa có list
    expect(screen.getByLabelText('Activity feed và thống kê').querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Danh sách hoạt động' })).not.toBeInTheDocument();
    resolveFeed({ items: [ITEM], total: 1 });
    await screen.findByRole('list', { name: 'Danh sách hoạt động' });
  });

  it('nút Làm mới busy khi đang tải — disabled + spinner, xong thì bật lại', async () => {
    const user = userEvent.setup();
    render(<ActivityPage />, { wrapper: createWrapper() });
    const btn = screen.getByRole('button', { name: /Làm mới/ });
    // initial load đang bay → disabled (busy state cũng áp cho lần tải đầu)
    expect(btn).toBeDisabled();
    await screen.findByText('Alice Nguyễn');
    expect(btn).toBeEnabled();
    // refresh: feed pending → busy
    let resolveRefresh!: (f: api.ActivityFeed) => void;
    mockedApi.fetchFeed.mockImplementationOnce(
      () => new Promise<api.ActivityFeed>((res) => { resolveRefresh = res; }),
    );
    await user.click(btn);
    expect(btn).toBeDisabled();
    expect(within(btn).getByRole('status')).toBeInTheDocument(); // Spinner
    resolveRefresh({ items: [ITEM], total: 1 });
    await screen.findByText('Alice Nguyễn');
    // Motion redesign: feed (SWR) render text ngay khi resolve — nút bật lại sau khi
    // CẢ stats refetch xong (1 microtask sau) → waitFor giữ intent "xong thì bật lại"
    await waitFor(() => expect(btn).toBeEnabled());
  });
});

describe('time helpers (SF-4)', () => {
  // NOW cố định theo +07:00 — các ISO test chọn cách xa ranh giới ngày ở cả UTC lẫn UTC+7
  const NOW = new Date('2026-10-14T09:00:00+07:00');

  it('formatDayHeading — cùng ngày local → "Hôm nay"', () => {
    expect(formatDayHeading('2026-10-14T02:30:00Z', NOW)).toBe('Hôm nay');
  });

  it('formatDayHeading — hôm qua local → "Hôm qua"', () => {
    expect(formatDayHeading('2026-10-13T02:30:00Z', NOW)).toBe('Hôm qua');
  });

  it('formatDayHeading — ngày khác → ngày đầy đủ vi-VN', () => {
    expect(formatDayHeading('2026-10-12T10:00:00Z', NOW)).toMatch(/12 tháng 10/);
    expect(formatDayHeading('2026-10-12T10:00:00Z', NOW)).toMatch(/2026/);
  });

  it('formatTime — vi-VN đầy đủ giờ:ngày (TZ pin trong vitest config)', () => {
    // TZ pinned Asia/Ho_Chi_Minh → 10:00Z = 17:00 local
    expect(formatTime('2026-10-12T10:00:00Z')).toMatch(/^\d{2}:\d{2}:\d{2}/);
    expect(formatTime('2026-10-12T10:00:00Z')).toContain('12/10/2026');
  });

  it('dayKey theo ngày LOCAL (không phải UTC)', () => {
    expect(dayKey('2026-10-14T17:30:00+07:00')).toBe(dayKey(NOW.toISOString()));
    expect(dayKey('2026-10-13T17:30:00+07:00')).not.toBe(dayKey(NOW.toISOString()));
  });
});
