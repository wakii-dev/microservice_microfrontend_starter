import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Menubar } from './index.js';
afterEach(cleanup);
describe('Menubar', () => {
  it('items + hover dropdown children', async () => {
    const user = userEvent.setup();
    render(<Menubar items={[{ key: 'f', label: 'File', children: [{ key: 'open', label: 'Mở' }] }]} />);
    await user.hover(screen.getByText('File'));
    expect(screen.getByText('Mở')).toBeInTheDocument();
  });
});

describe('Menubar — hover dropdown', () => {
  it('mouseEnter item có children → submenu hiện; child click gọi onClick', async () => {
    const onChild = vi.fn();
    const user = userEvent.setup();
    render(
      <Menubar
        items={[
          {
            key: 'file',
            label: 'File',
            children: [{ key: 'new', label: 'New task', onClick: onChild }],
          },
        ]}
      />,
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'File' }));
    expect(screen.getByText('New task')).toBeInTheDocument();
    await user.click(screen.getByText('New task'));
    expect(onChild).toHaveBeenCalledTimes(1);
    // mouseLeave → dropdown đóng
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'File' }));
    expect(screen.queryByText('New task')).toBeNull();
  });

  it('item lá (không children) → onClick trực tiếp', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Menubar items={[{ key: 'help', label: 'Help', onClick }]} />);
    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Menubar — danger item', () => {
  it('child danger → class text-st-fail (đỏ, hover bg-st-fail/12)', async () => {
    render(
      <Menubar
        items={[
          {
            key: 'task',
            label: 'Task',
            children: [{ key: 'del', label: 'Delete task…', danger: true }],
          },
        ]}
      />,
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Task' }));
    const item = screen.getByText('Delete task…');
    expect(item.className).toContain('text-st-fail');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Menubar — classNames slots + style', () => {
  const ITEMS = [
    { key: 'file', label: 'File', children: [{ key: 'new', label: 'New' }] },
    { key: 'help', label: 'Help' },
  ];

  it('slots lên đúng element: root/item/itemButton/submenu/subItem', () => {
    render(
      <Menubar
        items={ITEMS}
        classNames={{ root: 'slot-root', item: 'slot-item', itemButton: 'slot-btn', submenu: 'slot-sub', subItem: 'slot-sub-btn' }}
      />,
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'File' }));
    expect(document.querySelector('nav.slot-root')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'File' }).closest('div')).toHaveClass('slot-item');
    expect(screen.getByRole('button', { name: 'File' })).toHaveClass('slot-btn');
    expect(document.querySelector('ul.slot-sub')).not.toBeNull();
    expect(screen.getByText('New')).toHaveClass('slot-sub-btn');
  });

  it('style passthrough lên nav; className người dùng sau root slot', () => {
    render(
      <Menubar items={ITEMS} style={{ padding: '2px' }} classNames={{ root: 'slot-root' }} className="user-last" />,
    );
    const nav = document.querySelector('nav.slot-root') as HTMLElement;
    expect(nav).toHaveStyle({ padding: '2px' });
    expect(nav.className.indexOf('slot-root')).toBeLessThan(nav.className.indexOf('user-last'));
  });
});
