// Component tests — mock api layer, kiểm tra UI flow: list → tạo → sửa status → edit inline
// → delete confirm → load-more → filter → per-item busy → error banner (SF-3, VU-56).
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
    deleteTask: vi.fn(),
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

const TASK_B: api.Task = {
  id: '22222222-2222-2222-2222-222222222222',
  title: 'Task B',
  description: 'Mô tả B',
  status: 'in_progress',
  assigneeId: '33333333-3333-3333-3333-333333333333',
  createdBy: 'u1',
  createdAt: '2026-10-11T05:30:00Z',
  updatedAt: '2026-10-11T05:30:00Z',
};

function mockList(items: api.Task[] = [TASK_A], total = items.length) {
  mockedApi.fetchTasks.mockResolvedValue({ items, total });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockList();
});

describe('TasksPage', () => {
  it('render danh sách sau khi load — title + tổng + gọi fetchTasks({}) mặc định', async () => {
    render(<TasksPage />);
    expect(await screen.findByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Danh sách (1/1)')).toBeInTheDocument();
    expect(mockedApi.fetchTasks).toHaveBeenCalledWith({});
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

  it('tạo task THẤT BẠI — banner hiện, input GIỮ NGUYÊN cho user sửa (không xoá draft)', async () => {
    const user = userEvent.setup();
    mockedApi.createTask.mockRejectedValue(new api.ApiError(503, {
      error: { code: 'SPRING_UNREACHABLE', message: 'spring-svc down', requestId: 'r1', details: null },
    }));
    render(<TasksPage />);

    await screen.findByText('Task A');
    await user.type(screen.getByLabelText('Tiêu đề'), 'Task sẽ fail');
    await user.click(screen.getByRole('button', { name: 'Tạo task' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Task sẽ fail');
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

  it('danh sách rỗng → EmptyState "Chưa có task nào"', async () => {
    mockList([]);
    render(<TasksPage />);
    expect(await screen.findByText('Chưa có task nào')).toBeInTheDocument();
  });

  it('loading đầu → Skeleton thay list', () => {
    mockedApi.fetchTasks.mockReturnValue(new Promise(() => {}));
    const { container } = render(<TasksPage />);
    expect(container.querySelector('.bp-skeleton--row')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Danh sách tasks' })).not.toBeInTheDocument();
  });

  it('đổi status qua select → updateTask(task.id, { status })', async () => {
    const user = userEvent.setup();
    mockedApi.updateTask.mockResolvedValue({ ...TASK_A, status: 'done' });
    render(<TasksPage />);

    const select = await screen.findByRole('combobox', { name: 'Trạng thái task Task A' });
    await user.selectOptions(select, 'done');

    await waitFor(() => expect(mockedApi.updateTask).toHaveBeenCalledWith(TASK_A.id, { status: 'done' }));
  });

  it('per-item busy — select disabled + Spinner hiện khi PATCH đang bay', async () => {
    const user = userEvent.setup();
    let resolvePatch: (t: api.Task) => void = () => {};
    mockedApi.updateTask.mockReturnValue(new Promise<api.Task>((resolve) => { resolvePatch = resolve; }));
    render(<TasksPage />);

    const select = await screen.findByRole('combobox', { name: 'Trạng thái task Task A' });
    await user.selectOptions(select, 'done');

    await waitFor(() => expect(select).toBeDisabled());
    expect(screen.getByRole('status', { name: 'Đang xử lý task Task A' })).toBeInTheDocument();

    resolvePatch({ ...TASK_A, status: 'done' });
    await waitFor(() => expect(select).toBeEnabled());
  });

  it('status assignment_failed → badge "Gán thất bại", KHÔNG select (PATCH cấm status hệ thống)', async () => {
    mockList([{ ...TASK_A, status: 'assignment_failed' }]);
    render(<TasksPage />);
    const badge = await screen.findByRole('status', { name: 'Trạng thái task Task A' });
    expect(badge).toHaveTextContent('Gán thất bại');
    // không combobox nào được render cho task assignment_failed
    expect(screen.queryByRole('combobox', { name: 'Trạng thái task Task A' })).not.toBeInTheDocument();
  });

  it('select writable CHỈ 3 giá trị — assignment_failed không nằm trong option', async () => {
    render(<TasksPage />);
    const select = await screen.findByRole('combobox', { name: 'Trạng thái task Task A' });
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(options).toEqual(['todo', 'in_progress', 'done']);
  });

  it('sửa inline — Lưu gọi PATCH đúng payload chỉ field đổi rồi thoát edit', async () => {
    const user = userEvent.setup();
    mockedApi.updateTask.mockResolvedValue({ ...TASK_A, title: 'Task A sửa', description: 'mô tả mới' });
    render(<TasksPage />);

    await user.click(await screen.findByRole('button', { name: 'Sửa task Task A' }));
    const titleInput = screen.getByLabelText('Sửa tiêu đề task Task A');
    const descInput = screen.getByLabelText('Sửa mô tả task Task A');
    await user.clear(titleInput);
    await user.type(titleInput, 'Task A sửa');
    await user.type(descInput, 'mô tả mới');
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => expect(mockedApi.updateTask).toHaveBeenCalledWith(TASK_A.id, { title: 'Task A sửa', description: 'mô tả mới' }));
    await waitFor(() => expect(screen.queryByLabelText('Sửa tiêu đề task Task A')).not.toBeInTheDocument());
  });

  it('sửa inline không đổi gì → Lưu KHÔNG gọi PATCH, thoát edit', async () => {
    const user = userEvent.setup();
    render(<TasksPage />);

    await user.click(await screen.findByRole('button', { name: 'Sửa task Task A' }));
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(mockedApi.updateTask).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByLabelText('Sửa tiêu đề task Task A')).not.toBeInTheDocument());
  });

  it('sửa inline — Huỷ thoát edit không gọi PATCH', async () => {
    const user = userEvent.setup();
    render(<TasksPage />);

    await user.click(await screen.findByRole('button', { name: 'Sửa task Task A' }));
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));

    expect(mockedApi.updateTask).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Sửa tiêu đề task Task A')).not.toBeInTheDocument();
  });

  it('sửa inline LƯU THẤT BẠI — form vẫn mở giữ draft (không đóng mất sửa đổi)', async () => {
    const user = userEvent.setup();
    mockedApi.updateTask.mockRejectedValue(new api.ApiError(400, {
      error: { code: 'VALIDATION_ERROR', message: 'Title không được rỗng', requestId: 'r2', details: null },
    }));
    render(<TasksPage />);

    await user.click(await screen.findByRole('button', { name: 'Sửa task Task A' }));
    const titleInput = screen.getByLabelText('Sửa tiêu đề task Task A');
    await user.clear(titleInput);
    await user.type(titleInput, 'Đổi rồi fail');
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Sửa tiêu đề task Task A')).toHaveValue('Đổi rồi fail');
  });

  it('xoá — confirm 2 bước rồi gọi deleteTask + reload', async () => {
    const user = userEvent.setup();
    mockedApi.deleteTask.mockResolvedValue(undefined);
    render(<TasksPage />);

    await user.click(await screen.findByRole('button', { name: 'Xoá task Task A' }));
    expect(screen.getByText('Xoá task này?')).toBeInTheDocument();
    expect(mockedApi.deleteTask).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Xác nhận xoá' }));

    await waitFor(() => expect(mockedApi.deleteTask).toHaveBeenCalledWith(TASK_A.id));
    await waitFor(() => expect(mockedApi.fetchTasks).toHaveBeenCalledTimes(2));
  });

  it('xoá — Huỷ ở bước confirm KHÔNG gọi deleteTask', async () => {
    const user = userEvent.setup();
    render(<TasksPage />);

    await user.click(await screen.findByRole('button', { name: 'Xoá task Task A' }));
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));

    expect(mockedApi.deleteTask).not.toHaveBeenCalled();
    expect(screen.queryByText('Xoá task này?')).not.toBeInTheDocument();
  });

  it('Tải thêm — gọi fetchTasks offset=tổng đã tải rồi nối thêm items', async () => {
    const user = userEvent.setup();
    mockedApi.fetchTasks
      .mockResolvedValueOnce({ items: [TASK_A], total: 2 })
      .mockResolvedValueOnce({ items: [TASK_B], total: 2 });
    render(<TasksPage />);

    expect(await screen.findByText('Danh sách (1/2)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tải thêm' }));

    await waitFor(() => expect(mockedApi.fetchTasks).toHaveBeenLastCalledWith({ offset: 1 }));
    expect(await screen.findByText('Danh sách (2/2)')).toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
  });

  it('đủ items (tasks.length === total) → KHÔNG có nút Tải thêm', async () => {
    render(<TasksPage />);
    await screen.findByText('Task A');
    expect(screen.queryByRole('button', { name: 'Tải thêm' })).not.toBeInTheDocument();
  });

  it('race load-more ↔ filter — response load-more stale KHÔNG contaminating list đã filter', async () => {
    const user = userEvent.setup();
    let resolveLoadMore: (v: api.TaskList) => void = () => {};
    mockedApi.fetchTasks
      .mockResolvedValueOnce({ items: [TASK_A], total: 2 }) // load đầu
      .mockReturnValueOnce(new Promise<api.TaskList>((resolve) => { resolveLoadMore = resolve; })) // load-more treo
      .mockResolvedValueOnce({ items: [TASK_B], total: 1 }); // filter in_progress
    render(<TasksPage />);

    await screen.findByText('Task A');
    await user.click(screen.getByRole('button', { name: 'Tải thêm' }));
    await user.click(screen.getByRole('button', { name: 'Đang làm' }));
    await screen.findByText('Task B'); // list đã filter xong
    expect(screen.getByText('Danh sách (1/1)')).toBeInTheDocument();

    // response load-more (filter cũ) về SAU — phải bị bỏ, không append
    resolveLoadMore({ items: [TASK_A], total: 2 });
    await waitFor(() => expect(screen.getByText('Danh sách (1/1)')).toBeInTheDocument());
    expect(screen.queryByText('Task A')).not.toBeInTheDocument();
  });

  it('filter status — chip "Đang làm" gọi fetchTasks({ status: "in_progress" })', async () => {
    const user = userEvent.setup();
    mockedApi.fetchTasks
      .mockResolvedValueOnce({ items: [TASK_A], total: 1 })
      .mockResolvedValueOnce({ items: [TASK_B], total: 1 });
    render(<TasksPage />);

    await screen.findByText('Task A');
    await user.click(screen.getByRole('button', { name: 'Đang làm' }));

    await waitFor(() => expect(mockedApi.fetchTasks).toHaveBeenLastCalledWith({ status: 'in_progress' }));
    expect(await screen.findByText('Task B')).toBeInTheDocument();
  });

  it('assignee hiển thị UUID rút gọn + tooltip full + createdAt trong <time>', async () => {
    mockList([TASK_B]);
    render(<TasksPage />);

    const uuid = await screen.findByTitle(TASK_B.assigneeId as string);
    expect(uuid).toHaveTextContent('33333333…');
    const time = screen.getByText(/2026/);
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', TASK_B.createdAt);
  });

  it('chưa gán assignee → hiện "Chưa gán"', async () => {
    render(<TasksPage />);
    expect(await screen.findByText('Chưa gán')).toBeInTheDocument();
  });
});
