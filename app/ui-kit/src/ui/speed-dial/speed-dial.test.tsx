import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeedDial } from './index.js';
afterEach(cleanup);

describe('SpeedDial', () => {
  it('FAB đóng mặc định; click mở actions; action click → callback + đóng', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <SpeedDial icon="+" actions={[{ key: 'a', icon: 'A', label: 'Action A', onClick }]} />
    );
    expect(screen.queryByLabelText('Action A')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Thao tác' }));
    expect(screen.getByLabelText('Action A')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Action A'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Action A')).toBeNull();
  });
});

describe('SpeedDial — FAB state', () => {
  it('aria-expanded flip + FAB xoay 45deg khi mở', async () => {
    const user = userEvent.setup();
    render(<SpeedDial icon="+" actions={[{ key: 'a', icon: 'A', label: 'Action A' }]} />);
    const fab = screen.getByRole('button', { name: 'Thao tác' });
    expect(fab).toHaveAttribute('aria-expanded', 'false');
    expect(fab.className).not.toContain('rotate-45');
    await user.click(fab);
    expect(fab).toHaveAttribute('aria-expanded', 'true');
    expect(fab.className).toContain('rotate-45');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('SpeedDial — classNames + style', () => {
  it('slots lên đúng element: root/action/trigger; className sau root slot', async () => {
    const user = userEvent.setup();
    render(
      <SpeedDial
        icon="+"
        actions={[{ key: 'a', icon: 'A', label: 'Action A' }]}
        classNames={{ root: 'slot-root', action: 'slot-action', trigger: 'slot-trigger' }}
        className="user-last"
      />,
    );
    const fab = screen.getByRole('button', { name: 'Thao tác' });
    expect(fab).toHaveClass('slot-trigger');
    expect(fab.parentElement).toHaveClass('slot-root');
    expect(fab.parentElement!.className.indexOf('slot-root')).toBeLessThan(fab.parentElement!.className.indexOf('user-last'));
    await user.click(fab);
    expect(screen.getByLabelText('Action A')).toHaveClass('slot-action');
  });

  it('style passthrough lên div gốc (FAB vẫn mở/đóng)', async () => {
    const user = userEvent.setup();
    render(<SpeedDial icon="+" actions={[]} style={{ margin: '8px' }} />);
    const fab = screen.getByRole('button', { name: 'Thao tác' });
    expect(fab.parentElement).toHaveStyle({ margin: '8px' });
    await user.click(fab);
    expect(fab).toHaveAttribute('aria-expanded', 'true');
  });
});
