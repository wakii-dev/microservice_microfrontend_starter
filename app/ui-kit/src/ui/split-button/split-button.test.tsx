// SplitButton tests — batch ⑱ behavior: mở/tắt, click item → onItemClick + đóng,
// click NGOÀI đóng (useClickAway), ESC đóng (useKeyPress), ArrowDown mở + focus
// item đầu, danger class, separator, icon, a11y menu/menuitem + aria.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SplitButton, type SplitButtonItem } from './index.js';

afterEach(cleanup);

const items: SplitButtonItem[] = [
  { key: 'save-run', label: 'Lưu + chạy', icon: <svg data-testid="ico-run" /> },
  { key: 'save-draft', label: 'Lưu nháp' },
  { key: '---', label: '', separator: true },
  { key: 'archive', label: 'Lưu trữ', danger: true },
];

function renderSplitButton(overrides: Partial<Parameters<typeof SplitButton>[0]> = {}) {
  const onItemClick = vi.fn();
  const onClick = vi.fn();
  render(
    <SplitButton
      label="Lưu task"
      items={items}
      onItemClick={onItemClick}
      onClick={onClick}
      {...overrides}
    />,
  );
  return { onItemClick, onClick };
}

const trigger = () => screen.getByRole('button', { name: 'Thêm tuỳ chọn' });
const menu = () => screen.queryByRole('menu');

describe('SplitButton — mở/tắt menu', () => {
  it('click trigger phụ → menu hiện role=menu + aria-expanded=true; click lần nữa → đóng', async () => {
    const user = userEvent.setup();
    renderSplitButton();
    expect(menu()).toBeNull();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    await user.click(trigger());
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger());
    expect(menu()).toBeNull();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('items render role=menuitem + item danger class text-st-fail', async () => {
    const user = userEvent.setup();
    renderSplitButton();
    await user.click(trigger());
    const item = screen.getByRole('menuitem', { name: 'Lưu + chạy' });
    expect(item).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Lưu trữ' })).toHaveClass('text-st-fail');
    // icon render trong item
    expect(item.querySelector('[data-testid="ico-run"]')).not.toBeNull();
  });

  it('separator item → đường phân cách border-t, KHÔNG phải button', async () => {
    const user = userEvent.setup();
    const { container } = { container: document.body };
    renderSplitButton();
    await user.click(trigger());
    const sep = container.querySelector('li.border-t') ?? screen.getByRole('menu').querySelector('li.border-t');
    expect(sep).not.toBeNull();
    expect(sep!.querySelector('button')).toBeNull();
  });

  it('chevron xoay 180deg khi open (transition class)', async () => {
    const user = userEvent.setup();
    renderSplitButton();
    expect(trigger().querySelector('span')!.className).not.toContain('rotate-180');
    await user.click(trigger());
    expect(trigger().querySelector('span')!.className).toContain('rotate-180');
  });
});

describe('SplitButton — đóng menu', () => {
  it('click item → onItemClick(key) + menu đóng', async () => {
    const { onItemClick } = renderSplitButton();
    const user = userEvent.setup();
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: 'Lưu + chạy' }));
    expect(onItemClick).toHaveBeenCalledWith('save-run');
    expect(menu()).toBeNull();
  });

  it('click NGOÀI container → menu đóng, onItemClick không gọi', async () => {
    const { onItemClick } = renderSplitButton();
    const user = userEvent.setup();
    await user.click(trigger());
    expect(menu()).not.toBeNull();
    fireEvent.mouseDown(document.body);
    expect(menu()).toBeNull();
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('ESC → menu đóng (useKeyPress window)', async () => {
    const user = userEvent.setup();
    renderSplitButton();
    await user.click(trigger());
    expect(menu()).not.toBeNull();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(menu()).toBeNull();
  });

  it('ArrowDown trên trigger → mở menu + focus item đầu (keyboard a11y)', async () => {
    renderSplitButton();
    expect(menu()).toBeNull();
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
    expect(menu()).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Lưu + chạy' }));
  });
});

describe('SplitButton — primary action', () => {
  it('click nút chính → onClick; menu không mở', async () => {
    const { onClick } = renderSplitButton();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Lưu task' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(menu()).toBeNull();
  });
});

describe('SplitButton — unity shell (feedback "1 thể thống nhất" 2026-10-18)', () => {
  it('1 khối liên tục (pattern PrimeReact/antd/MUI): KHÔNG divider span — solid seamless, default chỉ hairline border-l trên chevron', () => {
    const { container } = render(<SplitButton label="Lưu task" items={items} />);
    const shell = container.querySelector('span.relative > span');
    expect(shell).not.toBeNull();
    expect(shell).toHaveClass('rounded-lg', 'overflow-hidden', 'border-accent');
    const buttons = shell!.querySelectorAll('button');
    expect(buttons).toHaveLength(2); // main + chevron — không còn component Button lồng nhau
    expect(shell!.querySelector('span.w-px')).toBeNull(); // hết divider trang trí
    for (const b of buttons) {
      expect(b.className).not.toContain('border-l'); // solid: seamless tuyệt đối
      expect(b.className).not.toContain('rounded');
    }
    expect(shell!.querySelector('span.w-px')).toBeNull(); // hết divider trang trí (pattern đối thủ)
  });

  it('tông wrapper theo type: primary border-accent · default border-line · text transparent', () => {
    for (const [type, borderCls] of [
      ['primary', 'border-accent'],
      ['default', 'border-line'],
      ['text', 'border-transparent'],
    ] as const) {
      const { container, unmount } = render(<SplitButton label="t" items={[]} type={type} />);
      expect(container.querySelector('span.relative > span')).toHaveClass(borderCls);
      unmount();
    }
  });

  it('danger primary → wrapper border-st-fail (solid đỏ liền khối)', () => {
    const { container } = render(<SplitButton label="Xoá" items={[]} danger />);
    const shell = container.querySelector('span.relative > span');
    expect(shell).toHaveClass('border-st-fail');
    expect(shell!.querySelector('span.w-px')).toBeNull(); // solid: không divider (PrimeReact seamless)
  });

  it('default variant: hairline border-l CHỈ trên chevron (antd compact single-line), main trần', () => {
    const { container } = render(<SplitButton label="Lưu" type="default" items={items} />);
    const shell = container.querySelector('span.relative > span')!;
    const [main, chevron] = shell.querySelectorAll('button');
    expect(main.className).not.toContain('border-l');
    expect(chevron).toHaveClass('border-l', 'border-line');
  });

  it('size áp đồng bộ cả 2 nút: small h-8 / middle h-9 (mặc định) / large h-10', () => {
    for (const [size, cls] of [
      ['small', 'h-8'],
      ['middle', 'h-9'],
      ['large', 'h-10'],
    ] as const) {
      render(<SplitButton label={size} items={[]} size={size} />);
      for (const b of document.querySelectorAll('span.relative span button')) {
        expect(b).toHaveClass(cls);
      }
      cleanup();
    }
    render(<SplitButton label="mặc định" items={[]} />);
    for (const b of document.querySelectorAll('span.relative span button')) {
      expect(b).toHaveClass('h-9');
    }
  });
});
