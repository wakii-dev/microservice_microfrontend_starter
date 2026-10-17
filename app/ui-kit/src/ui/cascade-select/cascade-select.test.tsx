// CascadeSelect tests — chọn theo tầng: level 0 → con → leaf; onChange path
// từng tầng; leaf đóng panel + trigger hiện path 'Cha / Con'. Controlled
// harness (component là fully-controlled qua `value`).
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { CascadeSelect, type CascadeOption } from './index.js';

const TREE: CascadeOption[] = [
  {
    label: 'Hà Nội',
    value: 'hn',
    children: [
      { label: 'Ba Đình', value: 'hn-bd' },
      { label: 'Tây Hồ', value: 'hn-th' },
    ],
  },
  { label: 'Đà Nẵng', value: 'dn' },
];

function Harness({ onChange }: { onChange?: (path: string[]) => void }) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <CascadeSelect
      options={TREE}
      value={value}
      onChange={(path) => { setValue(path); onChange?.(path); }}
    />
  );
}

afterEach(cleanup);

describe('CascadeSelect', () => {
  it('đóng → trigger placeholder; click → panel hiện options tầng 0', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    expect(screen.getByText('Chọn…')).toBeInTheDocument();
    await user.click(container.querySelector('button')!);
    expect(screen.getByText('Hà Nội')).toBeInTheDocument();
    expect(screen.getByText('Đà Nẵng')).toBeInTheDocument();
    expect(screen.queryByText('Ba Đình')).toBeNull(); // tầng con chưa mở
  });

  it('chọn tầng cha → onChange path 1 phần tử + panel sang tầng con', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Harness onChange={onChange} />);
    await user.click(container.querySelector('button')!);
    await user.click(screen.getByText('Hà Nội'));
    expect(onChange).toHaveBeenCalledWith(['hn']);
    expect(screen.getByText('Ba Đình')).toBeInTheDocument();
    expect(screen.getByText('Tây Hồ')).toBeInTheDocument();
    expect(screen.queryByText('Đà Nẵng')).toBeNull();
  });

  it('chọn leaf → onChange full path + panel đóng + trigger hiện path value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Harness onChange={onChange} />);
    await user.click(container.querySelector('button')!);
    await user.click(screen.getByText('Hà Nội'));
    await user.click(screen.getByText('Ba Đình'));
    expect(onChange).toHaveBeenLastCalledWith(['hn', 'hn-bd']);
    expect(screen.queryByText('Tây Hồ')).toBeNull(); // panel đóng
    // Contract comp: trigger join VALUES ('hn / hn-bd'), không phải labels
    expect(screen.getByText('hn / hn-bd')).toBeInTheDocument();
  });

  it('chọn leaf cấp 1 (không children) → onChange + đóng ngay', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Harness onChange={onChange} />);
    await user.click(container.querySelector('button')!);
    await user.click(screen.getByText('Đà Nẵng'));
    expect(onChange).toHaveBeenCalledWith(['dn']);
    expect(screen.queryByText('Hà Nội')).toBeNull();
    expect(screen.getByText('dn')).toBeInTheDocument(); // trigger hiện value
  });

  it('mở lại panel sau khi chọn → panel mở tại nhánh đang chọn', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const trigger = container.querySelector('button')!;
    await user.click(trigger);
    await user.click(screen.getByText('Hà Nội'));
    await user.click(screen.getByText('Ba Đình'));
    expect(screen.queryByText('Tây Hồ')).toBeNull(); // đã đóng
    await user.click(trigger); // mở lại
    expect(screen.getByText('Tây Hồ')).toBeInTheDocument(); // nhánh hn
    expect(screen.queryByText('Đà Nẵng')).toBeNull();
  });
});
