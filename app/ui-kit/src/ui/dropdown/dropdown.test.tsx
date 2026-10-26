// Dropdown tests — toggle/item click/ESC/outside/danger/disabled
// (+ keyboard a11y batch ⑫: role menu/menuitem, arrow keys, focus-first khi mở keyboard).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dropdown } from './index.js';

const ITEMS = [
  { key: 'edit', label: 'Sửa' },
  { key: '---', label: '' },
  { key: 'delete', label: 'Xoá', danger: true },
  { key: 'lock', label: 'Khoá', disabled: true },
];

afterEach(cleanup);

describe('Dropdown', () => {
  it('mặc định ẩn; click trigger mở menu items', async () => {
    const user = userEvent.setup();
    render(<Dropdown trigger={<button>Menu</button>} items={ITEMS} />);
    expect(screen.queryByText('Sửa')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByText('Sửa')).toBeInTheDocument();
    expect(screen.getByText('Xoá')).toHaveClass('text-st-fail');
  });

  it('item click → onItemClick(key) + đóng; disabled không gọi', async () => {
    const onItemClick = vi.fn();
    const user = userEvent.setup();
    render(<Dropdown trigger={<button>Menu</button>} items={ITEMS} onItemClick={onItemClick} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByText('Sửa'));
    expect(onItemClick).toHaveBeenCalledWith('edit');
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByText('Khoá'));
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  it('ESC đóng', async () => {
    const user = userEvent.setup();
    render(<Dropdown trigger={<button>Menu</button>} items={ITEMS} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Sửa')).toBeNull();
  });
});

describe('Dropdown — branch phụ (Tier 5 sweep)', () => {
  it('divider "---" → li border; item disabled → class cursor-not-allowed', async () => {
    const user = userEvent.setup();
    render(<Dropdown trigger={<button>Menu</button>} items={ITEMS} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(document.querySelector('.my-1.border-t')).not.toBeNull();
    expect(screen.getByText('Khoá').className).toContain('cursor-not-allowed');
  });
});

describe('Dropdown — keyboard a11y (batch ⑫ worker C)', () => {
  it('role=menu + role=menuitem; item disabled có aria-disabled', async () => {
    const user = userEvent.setup();
    render(<Dropdown trigger={<button>Menu</button>} items={ITEMS} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sửa' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Khoá' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('ArrowDown mở menu + focus item ĐẦU; ArrowDown/Up đi giữa item (bỏ disabled)', async () => {
    render(<Dropdown trigger={<button>Menu</button>} items={ITEMS} />);
    const trigger = screen.getByRole('button', { name: 'Menu' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sửa' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' }); // Sửa → Xoá (divider + Khoá disabled bị bỏ)
    expect(screen.getByRole('menuitem', { name: 'Xoá' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: 'Sửa' })).toHaveFocus();
  });

  it('End/Home → item cuối/đầu focusable', async () => {
    const user = userEvent.setup();
    render(<Dropdown trigger={<button>Menu</button>} items={ITEMS} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'End' });
    expect(screen.getByRole('menuitem', { name: 'Xoá' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Home' });
    expect(screen.getByRole('menuitem', { name: 'Sửa' })).toHaveFocus();
  });

  it('mở bằng Enter (keyboard click) → focus item đầu; ESC → đóng + TRẢ FOCUS về trigger', async () => {
    const user = userEvent.setup();
    render(<Dropdown trigger={<button>Menu</button>} items={ITEMS} />);
    const trigger = screen.getByRole('button', { name: 'Menu' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menuitem', { name: 'Sửa' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Dropdown — classNames + style', () => {
  it('slots lên đúng element: root/menu; className sau root slot', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={ITEMS}
        classNames={{ root: 'slot-root', menu: 'slot-menu' }}
        className="user-last"
      />,
    );
    const root = screen.getByRole('button', { name: 'Menu' }).closest('span')!.parentElement!;
    expect(root).toHaveClass('slot-root');
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('menu')).toHaveClass('slot-menu');
  });

  it('style passthrough lên span gốc (menu vẫn mở bình thường)', async () => {
    const user = userEvent.setup();
    render(<Dropdown trigger={<button>Menu</button>} items={ITEMS} style={{ margin: '8px' }} />);
    const root = screen.getByRole('button', { name: 'Menu' }).closest('span')!.parentElement as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
