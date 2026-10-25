// Component tests — KANBAN BOARD (redesign 2026-10-25): 3 cột render đúng ·
// tạo/sửa qua Modal · đổi status qua fallback dropdown (drag jsdom không simulate)
// · xoá 2 bước · search debounce · sort · progress · load-more · skeleton.
// Mock api layer (mirror suite cũ) — intent tests giữ: in-place mutation KHÔNG refetch.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { TasksPage } from '../src/TasksPage';
import * as api from '../src/api';
// resetAllMocks (không clearAllMocks) — tránh once-implementation queue leak sang test kế.
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

const TASK_C: api.Task = {
  id: '44444444-4444-4444-4444-444444444444',
  title: 'Task C',
  description: null,
  status: 'done',
  assigneeId: null,
  createdBy: 'u1',
  createdAt: '2026-10-10T00:00:00Z',
  updatedAt: '2026-10-10T00:00:00Z',
};

function mockList(items: api.Task[] = [TASK_A], total = items.length) {
  mockedApi.fetchTasks.mockResolvedValue({ items, total });
}

function columnOf(label: string) {
  return within(screen.getByRole('region', { name: `Cột ${label}` }));
}

beforeEach(() => {
  vi.resetAllMocks();
  mockList();
});

describe('TasksPage — Kanban board', () => {
  it('render 3 cột đúng data: Task A ở Cần làm, B ở Đang làm, C ở Xong + count badge', async () => {
    mockList([TASK_A, TASK_B, TASK_C]);
    render(<TasksPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('Task A')).toBeInTheDocument();
    expect(columnOf('Cần làm').getByText('Task A')).toBeInTheDocument();
    expect(columnOf('Đang làm').getByText('Task B')).toBeInTheDocument();
    expect(columnOf('Xong').getByText('Task C')).toBeInTheDocument();
    // fetch KHÔNG status param — board lấy cả 3 cột từ 1 query
    expect(mockedApi.fetchTasks).toHaveBeenCalledWith({});
  });

  it('tạo task QUA MODAL — submit gọi createTask, card pop vào cột Cần làm (không refetch)', async () => {
    const user = userEvent.setup();
    const TASK_NEW: api.Task = { ...TASK_A, id: '99999999-9999-9999-9999-999999999999', title: 'Task mới' };
    mockedApi.createTask.mockResolvedValue(TASK_NEW);
    render(<TasksPage />, { wrapper: createWrapper() });

    await screen.findByText('Task A');
    await user.click(screen.getByRole('button', { name: 'Thêm' }));
    await user.type(screen.getByLabelText('Tiêu đề*'), 'Task mới');
    await user.type(screen.getByLabelText('Mô tả'), 'mô tả ngắn');
    await user.click(screen.getByRole('button', { name: 'Tạo task' }));

    await waitFor(() => expect(mockedApi.createTask).toHaveBeenCalledWith({ title: 'Task mới', description: 'mô tả ngắn' }));
    expect(mockedApi.fetchTasks).toHaveBeenCalledTimes(1); // in-place — KHÔNG refetch
    // modal đóng + card nằm trong cột Cần làm
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(columnOf('Cần làm').getByText('Task mới')).toBeInTheDocument();
  });

  it('tạo THẤT BẠI — banner hiện, modal GIỮ MỞ + draft nguyên cho user sửa', async () => {
    const user = userEvent.setup();
    mockedApi.createTask.mockRejectedValue(
      new api.ApiError(503, {
        error: { code: 'SPRING_UNREACHABLE', message: 'spring-svc down', requestId: 'r1', details: null },
      }),
    );
    render(<TasksPage />, { wrapper: createWrapper() });

    await screen.findByText('Task A');
    await user.click(screen.getByRole('button', { name: 'Thêm' }));
    await user.type(screen.getByLabelText('Tiêu đề*'), 'Task sẽ fail');
    await user.click(screen.getByRole('button', { name: 'Tạo task' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Tiêu đề*')).toHaveValue('Task sẽ fail');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('load fail với error envelope → banner role=alert hiện message', async () => {
    mockedApi.fetchTasks.mockRejectedValue(
      new api.ApiError(503, {
        error: { code: 'SPRING_UNREACHABLE', message: 'spring-svc down', requestId: 'r1', details: null },
      }),
    );
    render(<TasksPage />, { wrapper: createWrapper() });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('spring-svc');
  });

  it('board rỗng → mỗi cột hint "Kéo card vào đây"', async () => {
    mockList([]);
    render(<TasksPage />, { wrapper: createWrapper() });
    expect(await screen.findAllByText('Kéo card vào đây')).toHaveLength(3);
  });

  it('loading đầu → skeleton 3 cột thay board', () => {
    mockedApi.fetchTasks.mockReturnValue(new Promise(() => {}));
    const { container } = render(<TasksPage />, { wrapper: createWrapper() });
    const skeleton = container.querySelector('[aria-busy="true"][role="status"]');
    expect(skeleton).not.toBeNull();
    expect(screen.queryByRole('region', { name: 'Cột Cần làm' })).not.toBeInTheDocument();
  });

  it('đổi status qua FALLBACK dropdown (combobox) → updateTask + card sang cột mới', async () => {
    const user = userEvent.setup();
    mockedApi.updateTask.mockResolvedValue({ ...TASK_A, status: 'done' });
    render(<TasksPage />, { wrapper: createWrapper() });

    await user.click(await screen.findByRole('combobox', { name: 'Trạng thái task Task A' }));
    await user.click(screen.getByRole('option', { name: 'Xong' }));

    await waitFor(() => expect(mockedApi.updateTask).toHaveBeenCalledWith(TASK_A.id, { status: 'done' }));
    // card chuyển cột (in-place — KHÔNG refetch)
    await waitFor(() => expect(columnOf('Xong').getByText('Task A')).toBeInTheDocument());
    expect(mockedApi.fetchTasks).toHaveBeenCalledTimes(1);
  });

  it('per-item busy — select disabled + card mờ khi PATCH đang bay, xong → enabled', async () => {
    const user = userEvent.setup();
    // PATCH resolve sau 60ms — đủ cửa sổ assert trạng thái busy
    mockedApi.updateTask.mockImplementation(
      () => new Promise<api.Task>((resolve) => setTimeout(() => resolve({ ...TASK_A, status: 'done' }), 60)),
    );
    render(<TasksPage />, { wrapper: createWrapper() });

    const select = await screen.findByRole('combobox', { name: 'Trạng thái task Task A' });
    await user.click(select);
    await user.click(screen.getByRole('option', { name: 'Xong' }));

    // đang bay: select khoá + card mờ
    await waitFor(() => expect(select).toBeDisabled());
    const card = document.querySelector('[data-testid="kanban-card-11111111-1111-1111-1111-111111111111"]');
    expect(card?.className).toContain('opacity-60');

    // xong: card chuyển cột (select cũ unmount) — re-query MỖI poll, assert enabled lại
    await waitFor(() => {
      const current = screen.getByRole('combobox', { name: 'Trạng thái task Task A' });
      expect(current).toBeEnabled();
    });
  });

  it('status assignment_failed → slim column "Gán thất bại": badge + KHÔNG combobox (PATCH cấm)', async () => {
    mockList([{ ...TASK_A, status: 'assignment_failed' }]);
    render(<TasksPage />, { wrapper: createWrapper() });
    const badge = await screen.findByRole('status', { name: 'Trạng thái task Task A' });
    expect(badge).toHaveTextContent('Gán thất bại');
    expect(screen.queryByRole('combobox', { name: 'Trạng thái task Task A' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Cột Gán thất bại' })).toBeInTheDocument();
    // task hệ thống tách cột riêng — KHÔNG nằm trong 3 cột writable
    expect(columnOf('Cần làm').queryByText('Task A')).not.toBeInTheDocument();
    expect(columnOf('Gán thất bại').getByText('Task A')).toBeInTheDocument();
  });

  it('fallback dropdown writable CHỈ 3 giá trị — assignment_failed không nằm trong option', async () => {
    const user = userEvent.setup();
    render(<TasksPage />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole('combobox', { name: 'Trạng thái task Task A' }));
    const optionLabels = screen.getAllByRole('option').map((o) => o.textContent);
    expect(optionLabels).toEqual(['Cần làm', 'Đang làm', 'Xong']);
  });

  it('sửa QUA MODAL — Lưu gọi PATCH đúng payload chỉ field đổi rồi đóng', async () => {
    const user = userEvent.setup();
    mockedApi.updateTask.mockResolvedValue({ ...TASK_A, title: 'Task A sửa', description: 'mô tả mới' });
    render(<TasksPage />, { wrapper: createWrapper() });

    await user.click(await screen.findByRole('button', { name: 'Sửa task Task A' }));
    const titleInput = screen.getByLabelText('Tiêu đề*');
    const descInput = screen.getByLabelText('Mô tả');
    expect(titleInput).toHaveValue('Task A'); // prefill giá trị hiện tại
    await user.clear(titleInput);
    await user.type(titleInput, 'Task A sửa');
    await user.type(descInput, 'mô tả mới');
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => expect(mockedApi.updateTask).toHaveBeenCalledWith(TASK_A.id, { title: 'Task A sửa', description: 'mô tả mới' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('sửa không đổi gì → Lưu KHÔNG gọi PATCH, modal đóng', async () => {
    const user = userEvent.setup();
    render(<TasksPage />, { wrapper: createWrapper() });

    await user.click(await screen.findByRole('button', { name: 'Sửa task Task A' }));
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(mockedApi.updateTask).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('sửa — Huỷ/ESC không gọi PATCH', async () => {
    const user = userEvent.setup();
    render(<TasksPage />, { wrapper: createWrapper() });

    await user.click(await screen.findByRole('button', { name: 'Sửa task Task A' }));
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));

    expect(mockedApi.updateTask).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('sửa LƯU THẤT BẠI — modal vẫn mở giữ draft', async () => {
    const user = userEvent.setup();
    mockedApi.updateTask.mockRejectedValue(
      new api.ApiError(400, {
        error: { code: 'VALIDATION_ERROR', message: 'Title không được rỗng', requestId: 'r2', details: null },
      }),
    );
    render(<TasksPage />, { wrapper: createWrapper() });

    await user.click(await screen.findByRole('button', { name: 'Sửa task Task A' }));
    const titleInput = screen.getByLabelText('Tiêu đề*');
    await user.clear(titleInput);
    await user.type(titleInput, 'Đổi rồi fail');
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Tiêu đề*')).toHaveValue('Đổi rồi fail');
  });

  it('xoá — confirm 2 bước rồi deleteTask, card biến mất in-place (không refetch)', async () => {
    const user = userEvent.setup();
    mockedApi.deleteTask.mockResolvedValue(undefined);
    render(<TasksPage />, { wrapper: createWrapper() });

    await user.click(await screen.findByRole('button', { name: 'Xoá task Task A' }));
    expect(screen.getByText('Xoá task này?')).toBeInTheDocument();
    expect(mockedApi.deleteTask).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Xác nhận xoá' }));

    await waitFor(() => expect(mockedApi.deleteTask).toHaveBeenCalledWith(TASK_A.id));
    expect(mockedApi.fetchTasks).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('Task A')).not.toBeInTheDocument());
  });

  it('xoá — Huỷ ở confirm KHÔNG gọi deleteTask', async () => {
    const user = userEvent.setup();
    render(<TasksPage />, { wrapper: createWrapper() });

    await user.click(await screen.findByRole('button', { name: 'Xoá task Task A' }));
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));

    expect(mockedApi.deleteTask).not.toHaveBeenCalled();
    expect(screen.queryByText('Xoá task này?')).not.toBeInTheDocument();
  });

  it('search debounce — type tiêu đề → chỉ card khớp còn trong board', async () => {
    const user = userEvent.setup();
    mockList([TASK_A, TASK_B]);
    render(<TasksPage />, { wrapper: createWrapper() });

    await screen.findByText('Task A');
    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm task' }), 'Task B');

    // debounce 200ms — Task A biến mất sau khi debounce settles
    await waitFor(() => expect(screen.queryByText('Task A')).not.toBeInTheDocument());
    expect(screen.getByText('Task B')).toBeInTheDocument();
  });

  it('sort "Cũ nhất" → thứ tự card trong cột đảo (updatedAt)', async () => {
    const user = userEvent.setup();
    const TASK_A2: api.Task = { ...TASK_A, updatedAt: '2026-10-12T00:00:00Z' };
    const TASK_B_TODO: api.Task = { ...TASK_B, status: 'todo', updatedAt: '2026-10-09T00:00:00Z' };
    mockList([TASK_A2, TASK_B_TODO]);
    render(<TasksPage />, { wrapper: createWrapper() });

    // mặc định newest: Task A (12/10) trước Task B (09/10) trong cùng cột Cần làm
    await screen.findByText('Task A');
    expect(columnOf('Cần làm').getAllByText(/^Task [AB]$/).map((el) => el.textContent)).toEqual(['Task A', 'Task B']);

    await user.click(screen.getByRole('radio', { name: 'Cũ nhất' }));
    expect(columnOf('Cần làm').getAllByText(/^Task [AB]$/).map((el) => el.textContent)).toEqual(['Task B', 'Task A']);
  });

  it('progress "n/N xong" theo số card done', async () => {
    mockList([TASK_A, TASK_C]);
    render(<TasksPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('1/2 xong')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Tiến độ hoàn thành' })).toHaveAttribute('aria-valuenow', '1');
  });

  it('Tải thêm — fetchTasks offset rồi board nối thêm items', async () => {
    const user = userEvent.setup();
    mockedApi.fetchTasks
      .mockResolvedValueOnce({ items: [TASK_A], total: 2 })
      .mockResolvedValueOnce({ items: [TASK_B], total: 2 });
    render(<TasksPage />, { wrapper: createWrapper() });

    expect(await screen.findByText('Task A')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tải thêm' }));

    await waitFor(() => expect(mockedApi.fetchTasks).toHaveBeenLastCalledWith({ offset: 1 }));
    expect(await screen.findByText('Task B')).toBeInTheDocument();
  });
});

// Wrapper tạo QueryClientProvider mới mỗi test (mirror test-utils).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}
