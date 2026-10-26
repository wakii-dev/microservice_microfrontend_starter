// FloatButton tests — render + onClick, Group hover/click trigger, controlled open,
// BackTop threshold + scrollTo top.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FloatButton, FloatButtonBackTop, FloatButtonGroup } from './index.js';
import { Icon } from '../icons/index.js';

afterEach(cleanup);

describe('FloatButton', () => {
  it('render nút với aria-label từ tooltip + click gọi onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<FloatButton icon={<Icon name="plus" size={16} />} tooltip="Thêm mới" onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Thêm mới' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shape square → rounded-lg; circle (mặc định) → rounded-pill', () => {
    const { rerender } = render(<FloatButton icon="+" tooltip="b" shape="square" />);
    expect(screen.getByRole('button', { name: 'b' }).className).toContain('rounded-lg');
    rerender(<FloatButton icon="+" tooltip="c" />);
    expect(screen.getByRole('button', { name: 'c' }).className).toContain('rounded-pill');
  });
});

describe('FloatButtonGroup', () => {
  it('trigger hover (mặc định): mouseEnter → mở cụm + aria-expanded; mouseLeave → đóng', () => {
    render(
      <FloatButtonGroup>
        <FloatButton icon={<Icon name="pencil" size={16} />} tooltip="Soạn" />
      </FloatButtonGroup>,
    );
    const trigger = screen.getByRole('button', { name: 'Thao tác nhanh' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.mouseEnter(trigger.closest('div')!);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.mouseLeave(trigger.closest('div')!);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('trigger click: click mở; click lần nữa đóng', async () => {
    const user = userEvent.setup();
    render(
      <FloatButtonGroup trigger="click">
        <FloatButton icon={<Icon name="pencil" size={16} />} tooltip="Soạn" />
      </FloatButtonGroup>,
    );
    const trigger = screen.getByRole('button', { name: 'Thao tác nhanh' });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('controlled open → cụm hiện theo prop, không cần trigger', () => {
    render(
      <FloatButtonGroup open>
        <FloatButton icon={<Icon name="pencil" size={16} />} tooltip="Soạn" />
        <FloatButton icon={<Icon name="upload" size={16} />} tooltip="Tải lên" />
      </FloatButtonGroup>,
    );
    expect(screen.getAllByRole('button', { name: 'Soạn' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Tải lên' })).toHaveLength(1);
  });

  it('onOpenChange báo trạng thái khi hover mở (trigger hover)', () => {
    const onOpenChange = vi.fn();
    render(
      <FloatButtonGroup onOpenChange={onOpenChange}>
        <FloatButton icon="+" tooltip="x" />
      </FloatButtonGroup>,
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Thao tác nhanh' }).closest('div')!);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

describe('FloatButtonBackTop', () => {
  it('scrollY dưới ngưỡng → ẩn; vượt ngưỡng → hiện + click → scrollTo top', async () => {
    let y = 0;
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y);
    const scrollTo = vi.fn();
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);
    render(<FloatButtonBackTop visibilityHeight={100} />);
    expect(screen.queryByRole('button', { name: 'Về đầu trang' })).toBeNull();
    y = 150;
    fireEvent.scroll(window);
    const btn = screen.getByRole('button', { name: 'Về đầu trang' });
    await userEvent.setup().click(btn);
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' }));
  });

  it('visibilityHeight tuỳ chỉnh — dưới ngưỡng mới vẫn ẩn', () => {
    const y = 300;
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => y);
    render(<FloatButtonBackTop visibilityHeight={500} />);
    fireEvent.scroll(window);
    expect(screen.queryByRole('button', { name: 'Về đầu trang' })).toBeNull();
  });

  it('gắn được qua FloatButton.BackTop (sub-component antd style)', () => {
    expect((FloatButton as unknown as { BackTop: unknown }).BackTop).toBe(FloatButtonBackTop);
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('FloatButton — classNames + style', () => {
  it('slots lên đúng element: button/icon (FloatButton), root/menu/trigger (Group)', () => {
    render(
      <FloatButtonGroup open classNames={{ root: 'slot-groot', menu: 'slot-menu', trigger: 'slot-trigger' }}>
        <FloatButton icon="+" tooltip="Soạn" classNames={{ root: 'slot-btn', icon: 'slot-icon' }} />
      </FloatButtonGroup>,
    );
    const trigger = screen.getByRole('button', { name: 'Thao tác nhanh' });
    expect(trigger).toHaveClass('slot-trigger');
    expect(trigger.parentElement).toHaveClass('slot-groot');
    expect(screen.getByRole('menu')).toHaveClass('slot-menu');
    const btn = screen.getByRole('button', { name: 'Soạn' });
    expect(btn).toHaveClass('slot-btn');
    expect(btn.querySelector('.slot-icon')).toBeInTheDocument();
  });

  it('style passthrough: FloatButton lên button, Group/BackTop lên div gốc', () => {
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => 100);
    render(
      <>
        <FloatButton icon="+" tooltip="s" style={{ margin: '4px' }} />
        <FloatButtonGroup open style={{ margin: '8px' }}>
          <span>x</span>
        </FloatButtonGroup>
        <FloatButtonBackTop visibilityHeight={50} style={{ margin: '12px' }} />
      </>,
    );
    fireEvent.scroll(window);
    expect(screen.getByRole('button', { name: 's' })).toHaveStyle({ margin: '4px' });
    const group = screen.getByRole('button', { name: 'Thao tác nhanh' }).parentElement as HTMLElement;
    expect(group).toHaveStyle({ margin: '8px' });
    const backTop = screen.getByRole('button', { name: 'Về đầu trang' }).parentElement as HTMLElement;
    expect(backTop).toHaveStyle({ margin: '12px' });
  });
});
