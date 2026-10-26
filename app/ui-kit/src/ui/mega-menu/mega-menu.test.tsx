// MegaMenu tests — hover/click mở, ESC/click-outside/mouseLeave đóng, role
// menu/menuitem, panel multi-column (grid-template-columns theo số group).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MegaMenu, type MegaMenuItem } from './index.js';

afterEach(cleanup);

const ITEMS: MegaMenuItem[] = [
  {
    key: 'product',
    label: 'Sản phẩm',
    children: [
      {
        key: 'dev',
        label: 'Phát triển',
        items: [
          { key: 'tasks', label: 'Tasks', onClick: vi.fn() },
          { key: 'activity', label: 'Activity' },
        ],
      },
      {
        key: 'ops',
        label: 'Vận hành',
        items: [{ key: 'monitor', label: 'Monitor' }],
      },
    ],
  },
  { key: 'about', label: 'Giới thiệu', onClick: vi.fn() },
];

describe('MegaMenu — mở/đóng', () => {
  it('render bar + root items; chưa có panel', () => {
    render(<MegaMenu items={ITEMS} />);
    expect(screen.getByRole('button', { name: 'Sản phẩm' })).toBeInTheDocument();
    expect(screen.queryByText('Phát triển')).toBeNull();
  });

  it('hover root có children → panel mở; mouseLeave → đóng', async () => {
    const user = userEvent.setup();
    render(<MegaMenu items={ITEMS} />);
    await user.hover(screen.getByRole('button', { name: 'Sản phẩm' }));
    expect(screen.getByText('Phát triển')).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Sản phẩm' }));
    expect(screen.queryByText('Phát triển')).toBeNull();
  });

  it('click root mở panel (đóng nhường ESC/leave/leaf); click leaf → onClick + đóng', () => {
    const onLeaf = vi.fn();
    render(
      <MegaMenu
        items={[
          {
            key: 'p',
            label: 'Sản phẩm',
            children: [{ key: 'g', label: 'Nhóm', items: [{ key: 'l', label: 'Leaf', onClick: onLeaf }] }],
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sản phẩm' }));
    expect(screen.getByText('Nhóm')).toBeInTheDocument();
    // fireEvent (không user-event): synthetic pointer-move của user-event phát
    // mouseout với relatedTarget ngoài wrapper → panel đóng trước click (giới
    // hạn tool test; browser thật relatedTarget=panel → giữ mở đúng).
    fireEvent.click(screen.getByRole('menuitem', { name: 'Leaf' }));
    expect(onLeaf).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Nhóm')).toBeNull();
  });

  it('ESC → panel đóng + trả focus về trigger', async () => {
    const user = userEvent.setup();
    render(<MegaMenu items={ITEMS} />);
    const trigger = screen.getByRole('button', { name: 'Sản phẩm' });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('root lá (không children) → click onClick trực tiếp, không có panel/menu', async () => {
    const onAbout = vi.fn();
    const user = userEvent.setup();
    render(<MegaMenu items={[{ key: 'about', label: 'Giới thiệu', onClick: onAbout }]} />);
    await user.click(screen.getByRole('button', { name: 'Giới thiệu' }));
    expect(onAbout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('MegaMenu — panel + a11y', () => {
  it('panel multi-column: grid-template-columns repeat(2, …) với 2 group', async () => {
    const user = userEvent.setup();
    render(<MegaMenu items={ITEMS} />);
    await user.hover(screen.getByRole('button', { name: 'Sản phẩm' }));
    const panel = screen.getByRole('menu');
    expect(panel.style.gridTemplateColumns).toBe('repeat(2, minmax(10rem, 1fr))');
    expect(screen.getByText('Vận hành')).toBeInTheDocument(); // cột 2
  });

  it('trigger aria-haspopup + aria-expanded; leaf role=menuitem', async () => {
    const user = userEvent.setup();
    render(<MegaMenu items={ITEMS} />);
    const trigger = screen.getByRole('button', { name: 'Sản phẩm' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.hover(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('menuitem')).toHaveLength(3); // 2 + 1 leaf
  });

  it('leaf danger → text-st-fail', async () => {
    const user = userEvent.setup();
    render(
      <MegaMenu
        items={[
          {
            key: 'p',
            label: 'Sản phẩm',
            children: [{ key: 'g', label: 'Nhóm', items: [{ key: 'del', label: 'Xoá dự án', danger: true }] }],
          },
        ]}
      />,
    );
    await user.hover(screen.getByRole('button', { name: 'Sản phẩm' }));
    expect(screen.getByRole('menuitem', { name: 'Xoá dự án' }).className).toContain('text-st-fail');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('MegaMenu — classNames slots + style', () => {
  const ITEMS: MegaMenuItem[] = [
    {
      key: 'products',
      label: 'Products',
      children: [{ key: 'g1', label: 'Group 1', items: [{ key: 'a', label: 'Alpha' }] }],
    },
  ];

  it('slots lên đúng element: root/item/trigger/panel/group/groupLabel/leaf', () => {
    render(
      <MegaMenu
        items={ITEMS}
        classNames={{
          root: 'slot-root', item: 'slot-item', trigger: 'slot-trigger', panel: 'slot-panel',
          group: 'slot-group', groupLabel: 'slot-group-label', leaf: 'slot-leaf',
        }}
      />,
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Products' }));
    expect(document.querySelector('nav.slot-root')).not.toBeNull();
    expect(screen.getByRole('menu')).toHaveClass('slot-panel');
    expect(screen.getByText('Group 1').parentElement).toHaveClass('slot-group');
    expect(screen.getByText('Group 1')).toHaveClass('slot-group-label');
    expect(screen.getByText('Alpha')).toHaveClass('slot-leaf');
  });

  it('style passthrough lên nav; className người dùng sau root slot', () => {
    render(
      <MegaMenu items={ITEMS} style={{ padding: '2px' }} classNames={{ root: 'slot-root' }} className="user-last" />,
    );
    const nav = document.querySelector('nav.slot-root') as HTMLElement;
    expect(nav).toHaveStyle({ padding: '2px' });
    expect(nav.className.indexOf('slot-root')).toBeLessThan(nav.className.indexOf('user-last'));
  });
});
