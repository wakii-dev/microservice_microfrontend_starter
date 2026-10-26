// Sidebar tests — brand/children/footer slot, collapse toggle (width + label
// fade qua MenuCompactContext), trigger a11y, onToggle callback.
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './index.js';
import { Menu, type MenuItemData } from '../menu/index.js';

afterEach(cleanup);

const menuItems: MenuItemData[] = [
  { key: 'home', label: 'Trang chủ' },
  { key: 'reports', label: 'Báo cáo', children: [{ key: 'reports-daily', label: 'Hàng ngày' }] },
];

describe('Sidebar — slot & a11y', () => {
  it('renders brand + children + footer', () => {
    render(
      <Sidebar brand={<span>Logo</span>} footer={<span>User chip</span>}>
        <span>Nội dung</span>
      </Sidebar>,
    );
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Nội dung')).toBeInTheDocument();
    expect(screen.getByText('User chip')).toBeInTheDocument();
  });

  it('role=complementary + aria-label (custom được)', () => {
    const { rerender } = render(<Sidebar>content</Sidebar>);
    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Sidebar');
    rerender(<Sidebar ariaLabel="Menu chính">content</Sidebar>);
    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Menu chính');
  });
});

describe('Sidebar — collapse', () => {
  it('mặc định mở: w-[200px] + data-collapsed=false + trigger aria-expanded', () => {
    render(<Sidebar>content</Sidebar>);
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-[200px]');
    expect(aside).toHaveAttribute('data-collapsed', 'false');
    expect(screen.getByRole('button', { name: 'Thu gọn' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('click trigger → w-20 (80px icon-only) + data-collapsed=true + label trigger đổi', () => {
    render(<Sidebar>content</Sidebar>);
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }));
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-20');
    expect(aside).toHaveAttribute('data-collapsed', 'true');
    expect(screen.getByRole('button', { name: 'Mở rộng' })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Mở rộng' }));
    expect(aside).toHaveClass('w-[200px]');
  });

  it('defaultCollapsed → icon-only ngay lần đầu', () => {
    render(<Sidebar defaultCollapsed>content</Sidebar>);
    expect(screen.getByRole('complementary')).toHaveClass('w-20');
    expect(screen.getByRole('button', { name: 'Mở rộng' })).toBeInTheDocument();
  });

  it('trigger mép phải cả 2 trạng thái; collapsed ngang hàng brand (top 28px), expanded giữa (50%)', () => {
    render(<Sidebar>content</Sidebar>);
    const expanded = screen.getByRole('button', { name: 'Thu gọn' });
    expect(expanded.className).toContain('-right-3');
    expect(expanded.style.top).toBe('50%');
    fireEvent.click(expanded);
    const collapsed = screen.getByRole('button', { name: 'Mở rộng' });
    expect(collapsed.className).toContain('-right-3');
    expect(collapsed.style.top).toBe('28px');
  });

  it('onToggle bắn trạng thái mới', () => {
    const onToggle = vi.fn();
    render(<Sidebar onToggle={onToggle}>content</Sidebar>);
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('transition width mượt (class transition-[width])', () => {
    render(<Sidebar>content</Sidebar>);
    expect(screen.getByRole('complementary').className).toContain('transition-[width]');
  });
});

describe('Sidebar + Menu icon-only', () => {
  it('collapse → Menu label fade (w-0 opacity-0); mở → label hiện', () => {
    render(
      <Sidebar>
        <Menu items={menuItems} />
      </Sidebar>,
    );
    const label = screen.getByRole('menuitem', { name: 'Trang chủ' }).querySelector('span')!;
    expect(label).toHaveClass('opacity-100');
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }));
    expect(label).toHaveClass('w-0', 'opacity-0');
    // chevron submenu ẩn khi icon-only
    expect(screen.getByRole('menuitem', { name: 'Báo cáo' }).querySelector('svg')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mở rộng' }));
    expect(label).toHaveClass('opacity-100');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Sidebar — classNames slots + style', () => {
  it('slots lên đúng element: root/brand/body/footer/trigger', () => {
    render(
      <Sidebar
        brand={<span>Brand</span>}
        footer={<span>User</span>}
        classNames={{ root: 'slot-root', brand: 'slot-brand', body: 'slot-body', footer: 'slot-footer', trigger: 'slot-trigger' }}
      >
        <span>nav content</span>
      </Sidebar>,
    );
    expect(document.querySelector('aside.slot-root')).not.toBeNull();
    expect(screen.getByText('Brand').parentElement).toHaveClass('slot-brand');
    expect(screen.getByText('nav content').closest('div')).toHaveClass('slot-body');
    expect(screen.getByText('User').parentElement).toHaveClass('slot-footer');
    expect(screen.getByRole('button', { name: 'Thu gọn' })).toHaveClass('slot-trigger');
  });

  it('style passthrough lên aside; className người dùng sau root slot', () => {
    render(
      <Sidebar style={{ background: 'rgb(1, 2, 3)' }} classNames={{ root: 'slot-root' }} className="user-last">
        <span>x</span>
      </Sidebar>,
    );
    const aside = document.querySelector('aside.slot-root') as HTMLElement;
    expect(aside).toHaveStyle({ background: 'rgb(1, 2, 3)' });
    expect(aside.className.indexOf('slot-root')).toBeLessThan(aside.className.indexOf('user-last'));
  });
});
