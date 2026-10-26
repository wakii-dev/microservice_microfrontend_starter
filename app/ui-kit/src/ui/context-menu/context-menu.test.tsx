// ContextMenu tests — mở/đóng, item click, divider, danger/disabled, keyboard nav, edge items rỗng.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContextMenu, type ContextMenuItem } from './index.js';
afterEach(cleanup);
const ITEMS: ContextMenuItem[] = [
  { key: 'edit', label: 'Sửa' },
  { key: '---', label: '' },
  { key: 'del', label: 'Xoá', danger: true },
  { key: 'lock', label: 'Khoá', disabled: true },
];

const openMenu = (onItemClick?: (k: string) => void) => {
  render(<ContextMenu items={ITEMS} onItemClick={onItemClick}><div>T</div></ContextMenu>);
  fireEvent.contextMenu(screen.getByText('T'));
  return screen.getByRole('menu');
};

describe('ContextMenu', () => {
  it('right-click → menu; item click → callback + đóng; ESC đóng', async () => {
    const onItemClick = vi.fn();
    const user = userEvent.setup();
    render(<ContextMenu items={ITEMS} onItemClick={onItemClick}><div>T</div></ContextMenu>);
    fireEvent.contextMenu(screen.getByText('T'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(screen.getByText('Sửa'));
    expect(onItemClick).toHaveBeenCalledWith('edit');
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.contextMenu(screen.getByText('T'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('a11y: role=menu + role=menuitem; disabled có aria-disabled', () => {
    openMenu();
    expect(screen.getByRole('menuitem', { name: 'Sửa' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Khoá' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('divider key --- → li phân tách, không phải menuitem', () => {
    openMenu();
    const menu = screen.getByRole('menu');
    expect(menu.querySelectorAll('li')).toHaveLength(4);
    expect(screen.queryByRole('menuitem', { name: '' })).toBeNull();
  });

  it('danger item → class text-st-fail', () => {
    openMenu();
    expect(screen.getByRole('menuitem', { name: 'Xoá' }).className).toContain('text-st-fail');
  });

  it('disabled item → không gọi callback + đóng giữ menu', async () => {
    const onItemClick = vi.fn();
    const user = userEvent.setup();
    openMenu(onItemClick);
    const lock = screen.getByRole('menuitem', { name: 'Khoá' }) as HTMLButtonElement;
    expect(lock.disabled).toBe(true);
    await user.click(lock);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('click ngoài menu → đóng', () => {
    openMenu();
    fireEvent.click(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('ArrowDown/ArrowUp đi vòng (bỏ disabled); từ chưa focus ArrowDown → item đầu', () => {
    openMenu();
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Sửa' })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Xoá' })).toHaveFocus(); // bỏ Khoá disabled
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: 'Sửa' })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: 'Xoá' })).toHaveFocus(); // vòng cuối
    fireEvent.keyDown(menu, { key: 'Home' });
    expect(screen.getByRole('menuitem', { name: 'Sửa' })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'End' });
    expect(screen.getByRole('menuitem', { name: 'Xoá' })).toHaveFocus();
  });

  it('items rỗng → menu vẫn mở (ul trống), keyboard không lỗi', () => {
    render(<ContextMenu items={[]}><div>T</div></ContextMenu>);
    fireEvent.contextMenu(screen.getByText('T'));
    const menu = screen.getByRole('menu');
    expect(menu.querySelectorAll('button')).toHaveLength(0);
    expect(() => fireEvent.keyDown(menu, { key: 'ArrowDown' })).not.toThrow();
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('ContextMenu — classNames + style', () => {
  it('slots lên đúng element: root/menu; className sau root slot', () => {
    render(
      <ContextMenu
        items={ITEMS}
        classNames={{ root: 'slot-root', menu: 'slot-menu' }}
        className="user-last"
      >
        <div>T</div>
      </ContextMenu>,
    );
    const region = screen.getByText('T').parentElement!;
    expect(region).toHaveClass('slot-root');
    expect(region.className.indexOf('slot-root')).toBeLessThan(region.className.indexOf('user-last'));
    fireEvent.contextMenu(screen.getByText('T'));
    expect(screen.getByRole('menu')).toHaveClass('slot-menu');
  });

  it('style passthrough lên vùng root (menu giữ left/top vị trí chuột)', () => {
    render(
      <ContextMenu items={ITEMS} style={{ margin: '8px' }}>
        <div>T</div>
      </ContextMenu>,
    );
    const region = screen.getByText('T').parentElement as HTMLElement;
    expect(region).toHaveStyle({ margin: '8px' });
    fireEvent.contextMenu(screen.getByText('T'));
    const menu = screen.getByRole('menu') as HTMLElement;
    expect(menu.style.left).not.toBe('');
    expect(menu.style.top).not.toBe('');
  });
});
