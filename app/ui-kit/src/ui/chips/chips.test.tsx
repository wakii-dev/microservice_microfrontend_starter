// Chips tests — Enter thêm tag, trùng/trống bỏ qua, × xoá, Backspace xoá cuối,
// disabled ẩn input + nút xoá.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { Chips } from './index.js';

// Controlled harness — Chips là fully-controlled (value prop), mock tĩnh sẽ
// dùng stale value ở tương tác thứ 2.
function Harness({ onChange, initial = ['react', 'vue'] }: { onChange?: (v: string[]) => void; initial?: string[] }) {
  const [value, setValue] = useState(initial);
  return <Chips value={value} onChange={(v) => { setValue(v); onChange?.(v); }} />;
}

afterEach(cleanup);

describe('Chips', () => {
  it('Enter thêm tag → onChange mảng mới + input xoá trống', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Chips value={['react']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'vue{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['react', 'vue']);
    expect(input).toHaveValue('');
  });

  it('tag trùng hoặc toàn space → không thêm (onChange không gọi)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Chips value={['react']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'react{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    await user.type(input, '   {Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('nút × theo tag → xoá đúng tag đó (2 lần liên tiếp qua controlled state)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Xoá react' }));
    expect(onChange).toHaveBeenLastCalledWith(['vue']);
    await user.click(screen.getByRole('button', { name: 'Xoá vue' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('button', { name: /Xoá/ })).toBeNull();
  });

  it('Backspace khi input rỗng → xoá tag cuối', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Chips value={['react', 'vue']} onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), '{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['react']);
  });

  it('disabled → ẩn input + nút xoá, chỉ còn tags hiển thị', () => {
    render(<Chips value={['react']} disabled />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Xoá react' })).toBeNull();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('placeholder chỉ hiện khi chưa có tag nào', () => {
    const { rerender } = render(<Chips value={[]} placeholder="Thêm tag…" />);
    expect(screen.getByPlaceholderText('Thêm tag…')).toBeInTheDocument();
    rerender(<Chips value={['react']} placeholder="Thêm tag…" />);
    expect(screen.getByPlaceholderText('')).toBeInTheDocument();
  });
});

describe('Chips — matrix gaps (a11y/props)', () => {
  it('mỗi nút xoá có aria-label riêng "Xoá <tag>" (screen-reader)', () => {
    render(<Chips value={['react', 'vue']} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Xoá react' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xoá vue' })).toBeInTheDocument();
  });

  it('placeholder hiển thị khi rỗng + className passthrough', () => {
    const { container } = render(<Chips value={[]} onChange={vi.fn()} placeholder="Thêm tag…" className="marker" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Thêm tag…');
    expect(container.firstElementChild).toHaveClass('marker');
  });
});

describe('Chips — classNames slots + style (slots wave 3)', () => {
  it('slots lên đúng element: root (span field) / tag / tagRemove / input', () => {
    render(
      <Chips
        value={['react']}
        classNames={{ root: 'slot-root', tag: 'slot-tag', tagRemove: 'slot-tag-remove', input: 'slot-input' }}
      />,
    );
    const root = screen.getByRole('textbox').closest('span')!;
    expect(root).toHaveClass('slot-root');
    expect(screen.getByText('react')).toHaveClass('slot-tag');
    expect(screen.getByRole('button', { name: 'Xoá react' })).toHaveClass('slot-tag-remove');
    expect(screen.getByRole('textbox')).toHaveClass('slot-input');
  });

  it('style passthrough lên root + không truyền slots → Enter thêm tag vẫn onChange (behavior giữ nguyên)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Chips value={['react']} onChange={onChange} style={{ margin: '8px' }} className="user-last" />);
    const root = screen.getByRole('textbox').closest('span') as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    expect(root.className.indexOf('user-last')).toBeGreaterThan(root.className.indexOf('inline-flex'));
    await user.type(screen.getByRole('textbox'), 'vue{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['react', 'vue']);
  });
});
