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
});
