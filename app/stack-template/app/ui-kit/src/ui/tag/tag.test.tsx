// Tag tests — plain + Checkable (filter chips pattern; antd CheckableTag look,
// nhưng giữ <button aria-pressed> — a11y TỐT HƠN antd (span+onClick)).
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tag } from './index.js';

afterEach(cleanup);

describe('Tag plain', () => {
  it('render span nhãn', () => {
    render(<Tag>đã tạo</Tag>);
    expect(screen.getByText('đã tạo').tagName).toBe('SPAN');
  });
});

describe('Tag.Checkable', () => {
  it('checked → <button aria-pressed=true> + class active nền accent', () => {
    render(
      <Tag.Checkable checked>
        Đang làm
      </Tag.Checkable>,
    );
    const el = screen.getByRole('button', { name: 'Đang làm' });
    expect(el).toHaveAttribute('aria-pressed', 'true');
    expect(el.className).toContain('bg-accent');
  });

  it('unchecked → aria-pressed=false, click gọi onChange(true)', async () => {
    const onChange = vi.fn();
    render(
      <Tag.Checkable checked={false} onChange={onChange}>
        Tất cả
      </Tag.Checkable>,
    );
    const el = screen.getByRole('button', { name: 'Tất cả' });
    expect(el).toHaveAttribute('aria-pressed', 'false');
    await userEvent.setup().click(el);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('className passthrough', () => {
    render(
      <Tag.Checkable checked={false} className="extra">
        X
      </Tag.Checkable>,
    );
    expect(screen.getByRole('button', { name: 'X' })).toHaveClass('extra');
  });
});

describe('Tag — completeness (Tier 1.5)', () => {
  it('closable → nút × gọi onClose (KHÔNG tự remove)', () => {
    const onClose = vi.fn();
    render(
      <Tag closable onClose={onClose}>
        đã tạo
      </Tag>,
    );
    expect(screen.getByText('đã tạo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
  });

  it('Checkable + icon → icon trước nhãn', () => {
    render(
      <Tag.Checkable checked icon={<span data-testid="tic" />}>
        Đang làm
      </Tag.Checkable>,
    );
    expect(screen.getByTestId('tic')).toBeInTheDocument();
  });
});

it('closable × click → onClose được gọi', async () => {
  const onClose = vi.fn();
  render(
    <Tag closable onClose={onClose}>
      x
    </Tag>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: 'Đóng' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

describe('Tag — combo (Tier 5 sweep)', () => {
  it('icon + closable cùng lúc → cả hai render', () => {
    const onClose = vi.fn();
    render(
      <Tag icon={<span data-testid="ti">▲</span>} closable onClose={onClose}>
        nhãn
      </Tag>,
    );
    expect(screen.getByTestId('ti')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
  });

  it('Checkable không icon → không span icon', () => {
    render(
      <Tag.Checkable checked={false}>
        trơn
      </Tag.Checkable>,
    );
    expect(screen.getByText('trơn').parentElement!.querySelectorAll('span[aria-hidden]').length).toBe(0);
  });

  it('plain className passthrough + không closable → không nút Đóng', () => {
    render(<Tag className="extra">nhãn</Tag>);
    const el = screen.getByText('nhãn');
    expect(el).toHaveClass('extra');
    expect(screen.queryByRole('button', { name: 'Đóng' })).toBeNull();
  });

  it('plain icon → icon bọc span aria-hidden (trang trí)', () => {
    render(<Tag icon={<span data-testid="pic">▲</span>}>nhãn</Tag>);
    expect(screen.getByTestId('pic')).toBeInTheDocument();
    expect(screen.getByTestId('pic').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('Checkable checked → click gọi onChange(false) (toggle về false)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Tag.Checkable checked onChange={onChange}>Đang làm</Tag.Checkable>);
    await user.click(screen.getByRole('button', { name: 'Đang làm' }));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

describe('Tag — classNames slots + style (SÓNG-3)', () => {
  it('Tag root slot + style lên span; className người dùng sau root slot; × vẫn onClose', async () => {
    const onClose = vi.fn();
    render(
      <Tag
        closable
        onClose={onClose}
        style={{ margin: '2px' }}
        classNames={{ root: 'slot-root' }}
        className="user-last"
      >
        nhãn
      </Tag>,
    );
    const el = screen.getByText('nhãn');
    expect(el).toHaveStyle({ margin: '2px' });
    expect(el).toHaveClass('slot-root');
    expect(el.className.indexOf('slot-root')).toBeLessThan(el.className.indexOf('user-last'));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Checkable root slot + style lên button; click vẫn onChange', async () => {
    const onChange = vi.fn();
    render(
      <Tag.Checkable
        checked={false}
        onChange={onChange}
        style={{ padding: '3px' }}
        classNames={{ root: 'slot-root' }}
        className="user-last"
      >
        Lọc
      </Tag.Checkable>,
    );
    const el = screen.getByRole('button', { name: 'Lọc' });
    expect(el).toHaveStyle({ padding: '3px' });
    expect(el.className.indexOf('slot-root')).toBeLessThan(el.className.indexOf('user-last'));
    await userEvent.setup().click(el);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
