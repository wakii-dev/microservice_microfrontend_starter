// Component tests — mock api layer, kiểm tra UI flow: list → tạo → sửa status → error banner.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { TasksPage } from '../src/TasksPage';
import * as api from '../src/api';

vi.mock('../src/api', async () => {
  const actual = await vi.importActual<typeof api>('../src/api');
  return {
    ...actual,
    fetchTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
  };
});

const mockedApi = vi.mocked(api);

const TASK_A: api.Task = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Task A',
  description: null,
  status: 'todo',
  assigneeId: null,
  createdBy: 'u1',
  createdAt: '2026-10-12T00:00:00Z',
  updatedAt: '2026-10-12T00:00:00Z',
};

function mockList(items: api.Task[] = [TASK_A]) {
  mockedApi.fetchTasks.mockResolvedValue({ items, total: items.length });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockList();
});

describe('TasksPage', () => {
  it('render danh sách sau khi load — title + tổng', async () => {
    render(<TasksPage />);
    expect(await screen.findByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Danh sách (1/1)')).toBeInTheDocument();
    expect(mockedApi.fetchTasks).toHaveBeenCalledTimes(1);
  });

  it('tạo task — submit form gọi createTask rồi reload list', async () => {
    const user = userEvent.setup();
    mockedApi.createTask.mockResolvedValue(TASK_A);
    render(<TasksPage />);

    await screen.findByText('Task A');
    await user.type(screen.getByLabelText('Tiêu đề'), 'Task mới');
    await user.type(screen.getByLabelText('Mô tả'), 'mô tả ngắn');
    await user.click(screen.getByRole('button', { name: 'Tạo task' }));

    await waitFor(() => expect(mockedApi.createTask).toHaveBeenCalledWith({ title: 'Task mới', description: 'mô tả ngắn' }));
    await waitFor(() => expect(mockedApi.fetchTasks).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('');
  });

  it('load fail với error envelope → banner role=alert hiện message', async () => {
    mockedApi.fetchTasks.mockRejectedValue(
      new api.ApiError(503, {
        error: { code: 'SPRING_UNREACHABLE', message: 'spring-svc down', requestId: 'r1', details: null },
      }),
    );
    render(<TasksPage />);
    const alert = await screen.findByRole('alert');
    // 503 → message hướng dẫn spring-svc chưa sẵn sàng (describeError)
    expect(alert).toHaveTextContent('spring-svc');
  });

  it('danh sách rỗng → empty state', async () => {
    mockList([]);
    render(<TasksPage />);
    expect(await screen.findByText(/Chưa có task nào/)).toBeInTheDocument();
  });

  it('đổi status qua select → updateTask(task.id, { status })', async () => {
    const user = userEvent.setup();
    mockedApi.updateTask.mockResolvedValue({ ...TASK_A, status: 'done' });
    render(<TasksPage />);

    const select = await screen.findByRole('combobox', { name: 'Trạng thái task Task A' });
    await user.selectOptions(select, 'done');

    await waitFor(() => expect(mockedApi.updateTask).toHaveBeenCalledWith(TASK_A.id, { status: 'done' }));
  });
});
