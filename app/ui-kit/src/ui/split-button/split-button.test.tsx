// SplitButton tests — kiến trúc MỘT <button> duy nhất (user directive 2026-10-18):
// chevron = span[data-chevron] vùng-click riêng bên trong nút (stopPropagation).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SplitButton } from './index.js';

afterEach(cleanup);

const items = [
  { key: 'save-run', label: 'Lưu + chạy' },
  { key: 'save-draft', label: 'Lưu nháp' },
];

function chevronOf(container: HTMLElement): HTMLElement {
  const el = container.querySelector('[data-chevron]');
  if (!el) throw new Error('chevron span not found');
  return el as HTMLElement;
}

async function openMenu(container: HTMLElement) {
  await userEvent.click(chevronOf(container));
  return screen.getByRole('menu');
}

describe('SplitButton — một nút duy nhất', () => {
  it('click vùng chevron → menu hiện role=menu + aria-expanded=true; click lần nữa → đóng', async () => {
    const { container } = render(<SplitButton label="Lưu" items={items} />);
    const btn = screen.getByRole('button', { name: /Lưu/ });
    expect(btn).toHaveAttribute('aria-haspopup', 'menu');
    await openMenu(container);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(chevronOf(container));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('items render role=menuitem + item danger class text-st-fail + icon', async () => {
    const { container } = render(
      <SplitButton label="Lưu" items={[...items, { key: 'del', label: 'Xoá', danger: true, icon: <svg data-testid="ico-del" /> }]} />,
    );
    await openMenu(container);
    expect(screen.getByRole('menuitem', { name: 'Lưu + chạy' })).toBeInTheDocument();
    expect(screen.getByTestId('ico-del')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Xoá' }).className).toContain('text-st-fail');
  });

  it('separator item → đường phân cách border-t, KHÔNG phải button', async () => {
    const { container } = render(
      <SplitButton label="Lưu" items={[...items, { key: 'sep', label: '', separator: true }]} />,
    );
    await openMenu(container);
    const sep = screen.getByRole('menu').querySelector('li.border-t');
    expect(sep).not.toBeNull();
    expect(sep!.querySelector('button')).toBeNull();
  });

  it('chevron icon xoay 180deg khi open (transition class)', async () => {
    const { container } = render(<SplitButton label="Lưu" items={items} />);
    expect(chevronOf(container).querySelector('svg')?.getAttribute('class')).not.toContain('rotate-180');
    await openMenu(container);
    expect(chevronOf(container).querySelector('svg')?.getAttribute('class')).toContain('rotate-180');
  });

  it('click item → onItemClick(key) + menu đóng', async () => {
    const onItemClick = vi.fn();
    const { container } = render(<SplitButton label="Lưu" items={items} onItemClick={onItemClick} />);
    await openMenu(container);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Lưu nháp' }));
    expect(onItemClick).toHaveBeenCalledWith('save-draft');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('click NGOÀI container → menu đóng, onItemClick không gọi', async () => {
    const onItemClick = vi.fn();
    const { container } = render(
      <div>
        <span data-outside>ngoài</span>
        <SplitButton label="Lưu" items={items} onItemClick={onItemClick} />
      </div>,
    );
    await openMenu(container);
    fireEvent.mouseDown(document.querySelector('[data-outside]')!);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('ESC → menu đóng (useKeyPress window)', async () => {
    const { container } = render(<SplitButton label="Lưu" items={items} />);
    await openMenu(container);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('ArrowDown trên nút → mở menu + focus item đầu (keyboard a11y)', async () => {
    render(<SplitButton label="Lưu" items={items} />);
    const btn = screen.getByRole('button', { name: /Lưu/ });
    btn.focus();
    fireEvent.keyDown(btn, { key: 'ArrowDown' });
    await vi.waitFor(() => {
      expect(screen.queryByRole('menu')).toBeInTheDocument();
      expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Lưu + chạy' }));
    });
  });

  it('click phần label của NÚT → onClick chạy; menu KHÔNG mở (chevron stopPropagation)', async () => {
    const onClick = vi.fn();
    render(<SplitButton label="Lưu" items={items} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: /Lưu/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('MỘT <button> duy nhất — chevron là span TRONG nút, không nút con thứ hai', () => {
    const { container } = render(<SplitButton label="Lưu" items={items} />);
    const shell = container.querySelector('span.relative')!;
    expect(shell.querySelectorAll(':scope > button')).toHaveLength(1); // ĐÚNG 1 nút duy nhất
    const btn = screen.getByRole('button', { name: /Lưu/ });
    expect(btn.querySelector('[data-chevron]')).not.toBeNull(); // chevron nằm trong nút
    expect(btn.className).toContain('rounded-lg'); // một nút bo tròn duy nhất
  });

  it('tông nút theo type: primary border-accent · default border-line · text transparent', () => {
    for (const [type, borderCls] of [
      ['primary', 'border-accent'],
      ['default', 'border-line'],
      ['text', 'border-transparent'],
    ] as const) {
      const { unmount } = render(<SplitButton label="Lưu" type={type} items={items} />);
      expect(screen.getByRole('button', { name: /Lưu/ }).className).toContain(borderCls);
      unmount();
    }
  });

  it('danger primary → nút border-st-fail solid đỏ', () => {
    render(<SplitButton label="Xoá" items={[]} danger />);
    const btn = screen.getByRole('button', { name: /Xoá/ });
    expect(btn.className).toContain('border-st-fail');
    expect(btn.className).toContain('bg-st-fail');
  });

  it('size đồng bộ Button: small h-8 / middle h-9 (mặc định) / large h-10', () => {
    for (const [size, h] of [
      ['small', 'h-8'],
      ['middle', 'h-9'],
      ['large', 'h-10'],
    ] as const) {
      const { unmount } = render(<SplitButton label="Lưu" size={size} items={items} />);
      expect(screen.getByRole('button', { name: /Lưu/ }).className).toContain(h);
      unmount();
    }
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('SplitButton — classNames + style', () => {
  it('slots lên đúng element: root/button/menu; className sau root slot', async () => {
    const { container } = render(
      <SplitButton
        label="Lưu"
        items={items}
        classNames={{ root: 'slot-root', button: 'slot-button', menu: 'slot-menu' }}
        className="user-last"
      />,
    );
    const shell = container.querySelector('span.relative')!;
    expect(shell).toHaveClass('slot-root');
    expect(shell.className.indexOf('slot-root')).toBeLessThan(shell.className.indexOf('user-last'));
    expect(screen.getByRole('button', { name: /Lưu/ })).toHaveClass('slot-button');
    await openMenu(container);
    expect(screen.getByRole('menu')).toHaveClass('slot-menu');
  });

  it('style passthrough lên span gốc (menu vẫn mở/đóng)', async () => {
    const { container } = render(<SplitButton label="Lưu" items={items} style={{ margin: '8px' }} />);
    const shell = container.querySelector('span.relative') as HTMLElement;
    expect(shell).toHaveStyle({ margin: '8px' });
    await openMenu(container);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
