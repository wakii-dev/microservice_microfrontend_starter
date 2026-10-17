// Dropdown tests — toggle/item click/ESC/outside/danger/disabled.
import { cleanup, render, screen } from '@testing-library/react';
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
