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

  it('collapsed → trigger căn giữa ngang (left-1/2); expanded → mép phải (-right-3)', () => {
    render(<Sidebar>content</Sidebar>);
    expect(screen.getByRole('button', { name: 'Thu gọn' }).className).toContain('-right-3');
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }));
    expect(screen.getByRole('button', { name: 'Mở rộng' }).className).toContain('left-1/2');
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
