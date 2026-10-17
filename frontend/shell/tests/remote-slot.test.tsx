import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RemoteSlot } from '../src/components/RemoteSlot';

// Mock fe-shared loadRemoteModule — test KHÔNG load remote thật (SF-6 sở hữu remote)
const loadRemoteModuleMock = vi.hoisted(() => vi.fn());
vi.mock('@boilerplate/fe-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@boilerplate/fe-shared')>();
  return { ...actual, loadRemoteModule: loadRemoteModuleMock };
});

afterEach(() => {
  cleanup();
  loadRemoteModuleMock.mockReset();
});

describe('RemoteSlot (error boundary remote-down)', () => {
  it('remote load fail → hiện fallback + nút thử lại, không crash app', async () => {
    loadRemoteModuleMock.mockRejectedValue(new Error('Remote "tasks" load failed'));
    render(<RemoteSlot name="tasks" exposedModule="./TasksPage" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Không tải được phần tasks');
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('bấm thử lại → gọi load lại remote; thành công → render nội dung', async () => {
    const user = userEvent.setup();
    loadRemoteModuleMock.mockRejectedValueOnce(new Error('down'));
    loadRemoteModuleMock.mockResolvedValueOnce({ default: () => <div>TASKS-CONTENT</div> });

    render(<RemoteSlot name="tasks" exposedModule="./TasksPage" />);
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    await waitFor(() => {
      expect(screen.getByText('TASKS-CONTENT')).toBeInTheDocument();
    });
    expect(loadRemoteModuleMock).toHaveBeenCalledTimes(2);
  });

  it('remote load thành công ngay → render nội dung, không fallback', async () => {
    loadRemoteModuleMock.mockResolvedValue({ default: () => <div>ACTIVITY-CONTENT</div> });
    render(<RemoteSlot name="activity" exposedModule="./ActivityPage" />);

    await waitFor(() => {
      expect(screen.getByText('ACTIVITY-CONTENT')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('đang tải → Suspense fallback là Skeleton (aria-busy), KHÔNG còn text "Đang tải…" (SF-2)', () => {
    loadRemoteModuleMock.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<RemoteSlot name="tasks" exposedModule="./TasksPage" />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText('Đang tải tasks…')).not.toBeInTheDocument();
  });

  it('re-render (click lại nav link đang đứng) KHÔNG load lại remote (lazy cache — P2 review fix)', async () => {
    loadRemoteModuleMock.mockResolvedValue({ default: () => <div>STABLE</div> });
    const { rerender } = render(
      <RemoteSlot name="tasks" exposedModule="./TasksPage" key="x" />,
    );
    await waitFor(() => expect(screen.getByText('STABLE')).toBeInTheDocument());
    expect(loadRemoteModuleMock).toHaveBeenCalledTimes(1);

    // re-render cùng props — lazy cache phải giữ component type, không import lại
    rerender(<RemoteSlot name="tasks" exposedModule="./TasksPage" key="x" />);
    expect(loadRemoteModuleMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('STABLE')).toBeInTheDocument();
  });

  it('BUG-2: bấm thử lại sau khi remote sống lại → recovery in-place (cờ retry bust sticky layer)', async () => {
    const user = userEvent.setup();
    // Mini-model sticky rejection: load fail NHỚ BÊN — chỉ lần gọi MANG CỜ retry
    // (registerRemotes force bên dưới fe-shared) mới phá được sticky layer.
    // RemoteSlot cũ không truyền cờ → retry nhận lại rejection cũ → fallback mãi mãi.
    let sticky = true;
    const stickyLoad = (opts?: { retry?: boolean }) => {
      if (opts?.retry) sticky = false;
      return sticky
        ? Promise.reject(new Error('Remote "tasks" load failed'))
        : Promise.resolve({ default: () => <div>TASKS-CONTENT</div> });
    };
    loadRemoteModuleMock.mockImplementation((...args: unknown[]) =>
      stickyLoad(args[2] as { retry?: boolean } | undefined),
    );

    render(<RemoteSlot name="tasks" exposedModule="./TasksPage" />);
    await screen.findByRole('alert');

    // Pin contract: lần đầu (attempt 0) KHÔNG được mang cờ — initial load không reset
    // cache runtime (nếu có regression truyền cờ mọi attempt, test này bắt tại đây).
    expect(loadRemoteModuleMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'tasks' }),
      './TasksPage',
      undefined,
    );

    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    await waitFor(() => {
      expect(screen.getByText('TASKS-CONTENT')).toBeInTheDocument();
    });
  });
});
