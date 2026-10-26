// BottomNavigation tests — render items, pick + onChange, controlled value,
// hideOnScroll xuống/up, không listener khi tắt hideOnScroll.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BottomNavigation } from './index.js';
import { Icon } from '../icons/index.js';

afterEach(cleanup);

const ITEMS = [
  { key: 'home', label: 'Trang chủ', icon: <Icon name="home" size={16} /> },
  { key: 'search', label: 'Tìm', icon: <Icon name="search" size={16} /> },
  { key: 'user', label: 'Tôi', icon: <Icon name="user" size={16} /> },
];

describe('BottomNavigation', () => {
  it('render đủ items — label hiển thị, nav có aria-label', () => {
    render(<BottomNavigation items={ITEMS} ariaLabel="Điều hướng chính" />);
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Trang chủ/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tôi/ })).toBeInTheDocument();
  });

  it('uncontrolled: click mục → aria-selected=true + onChange(key)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BottomNavigation items={ITEMS} onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: /Tìm/ }));
    expect(onChange).toHaveBeenCalledWith('search');
    expect(screen.getByRole('tab', { name: /Tìm/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('controlled value → aria-selected theo prop, không cần click', () => {
    render(<BottomNavigation items={ITEMS} value="user" />);
    expect(screen.getByRole('tab', { name: /Tôi/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Trang chủ/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('hideOnScroll: cuộn xuống >40px → ẩn (translate-y-full); cuộn lên → hiện lại', () => {
    let y = 0;
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y);
    render(<BottomNavigation items={ITEMS} hideOnScroll />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).not.toContain('translate-y-full');
    y = 120;
    fireEvent.scroll(window);
    expect(nav.className).toContain('translate-y-full');
    y = 80;
    fireEvent.scroll(window);
    expect(nav.className).not.toContain('translate-y-full');
  });

  it('hideOnScroll=false (mặc định): cuộn không thêm translate-y-full', () => {
    let y = 0;
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y);
    render(<BottomNavigation items={ITEMS} />);
    y = 200;
    fireEvent.scroll(window);
    expect(screen.getByRole('navigation').className).not.toContain('translate-y-full');
  });

  it('nút active dùng text-accent; nút thường text-ink3', () => {
    render(<BottomNavigation items={ITEMS} value="home" />);
    expect(screen.getByRole('tab', { name: /Trang chủ/ }).className).toContain('text-accent');
    expect(screen.getByRole('tab', { name: /Tìm/ }).className).toContain('text-ink3');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('BottomNavigation — classNames slots + style', () => {
  const ITEMS = [
    { key: 'home', label: 'Home', icon: <span>⌂</span> },
    { key: 'me', label: 'Me', icon: <span>☺</span> },
  ];

  it('slots lên đúng element: root/list/item/itemButton', () => {
    render(
      <BottomNavigation
        items={ITEMS}
        classNames={{ root: 'slot-root', list: 'slot-list', item: 'slot-item', itemButton: 'slot-btn' }}
      />,
    );
    expect(document.querySelector('nav.slot-root')).not.toBeNull();
    expect(document.querySelector('ul.slot-list')).not.toBeNull();
    expect(screen.getByRole('tab', { name: /Home/ }).closest('li')).toHaveClass('slot-item');
    expect(screen.getByRole('tab', { name: /Home/ })).toHaveClass('slot-btn');
  });

  it('style passthrough lên nav; className người dùng sau root slot', () => {
    render(
      <BottomNavigation
        items={ITEMS}
        style={{ background: 'rgb(1, 2, 3)' }}
        classNames={{ root: 'slot-root' }}
        className="user-last"
      />,
    );
    const nav = document.querySelector('nav.slot-root') as HTMLElement;
    expect(nav).toHaveStyle({ background: 'rgb(1, 2, 3)' });
    expect(nav.className.indexOf('slot-root')).toBeLessThan(nav.className.indexOf('user-last'));
  });
});
