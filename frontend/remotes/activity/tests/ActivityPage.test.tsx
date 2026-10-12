// Component tests — mock api layer: feed render userName/taskTitle TRỰC TIẾP (spec slice mục 4),
// stats tiles, lỗi stats không che feed (Promise.allSettled), empty state.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { ActivityPage } from '../src/ActivityPage';
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
  tasksByStatus: { todo: 3, in_progress: 2, done: 2 },
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

describe('ActivityPage', () => {
  it('render feed với user-display fields từ response (userName + taskTitle)', async () => {
    render(<ActivityPage />);
    // Cả hai field render trực tiếp từ response — không placeholder
    expect(await screen.findByText('Alice Nguyễn')).toBeInTheDocument();
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText(/đã tạo/)).toBeInTheDocument();
    expect(screen.getByText('Feed (1/1)')).toBeInTheDocument();
  });

  it('render stats tiles — tổng + 3 trạng thái + recent events', async () => {
    render(<ActivityPage />);
    expect(await screen.findByLabelText('Tổng số task')).toHaveTextContent('7');
    expect(screen.getByLabelText('Task Cần làm')).toHaveTextContent('3');
    expect(screen.getByLabelText('Task Đang làm')).toHaveTextContent('2');
    expect(screen.getByLabelText('Task Xong')).toHaveTextContent('2');
    expect(screen.getByLabelText('Sự kiện 24h qua')).toHaveTextContent('4');
  });

  it('stats fail → banner riêng, feed VẪN render (Promise.allSettled)', async () => {
    mockedApi.fetchStats.mockRejectedValue(
      new api.ApiError(503, {
        error: { code: 'READONLY_UNAVAILABLE', message: 'Không đọc được schema tasks', requestId: 'r1', details: null },
      }),
    );
    render(<ActivityPage />);
    expect(await screen.findByText(/Không đọc được schema tasks/)).toBeInTheDocument();
    expect(screen.getByText('Alice Nguyễn')).toBeInTheDocument();
  });

  it('feed fail → banner role=alert với message từ envelope', async () => {
    mockedApi.fetchFeed.mockRejectedValue(
      new api.ApiError(401, {
        error: { code: 'UNAUTHORIZED', message: 'Token hết hạn', requestId: 'r2', details: null },
      }),
    );
    render(<ActivityPage />);
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Token hết hạn/)).toBeInTheDocument();
  });

  it('feed rỗng → empty state gợi ý trang Tasks', async () => {
    mockFeed([]);
    render(<ActivityPage />);
    expect(await screen.findByText(/Chưa có hoạt động nào/)).toBeInTheDocument();
  });

  it('nút Làm mới → gọi lại cả feed + stats', async () => {
    const user = userEvent.setup();
    render(<ActivityPage />);
    await screen.findByText('Alice Nguyễn');
    await user.click(screen.getByRole('button', { name: 'Làm mới' }));
    await waitFor(() => expect(mockedApi.fetchFeed).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockedApi.fetchStats).toHaveBeenCalledTimes(2));
  });
});
