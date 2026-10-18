// PickList tests — 2 panel render, click pick highlight, › chuyển Nguồn→Đích,
// ‹ chuyển ngược, toggle bỏ pick, picked reset sau move.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PickList } from './index.js';

const SOURCE = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'ng' },
];
const TARGET = [{ label: 'Svelte', value: 'svelte' }];

afterEach(cleanup);

describe('PickList', () => {
  it('render 2 panel Nguồn/Đích với đủ items', () => {
    render(<PickList source={SOURCE} target={TARGET} />);
    expect(screen.getByText('Nguồn')).toBeInTheDocument();
    expect(screen.getByText('Đích')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Svelte')).toBeInTheDocument();
  });

  it('click item → picked highlight; nút › disabled → enabled', async () => {
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={[]} />);
    const right = screen.getByRole('button', { name: '›' });
    expect(right).toBeDisabled();
    await user.click(screen.getByText('React'));
    expect(screen.getByText('React')).toHaveClass('text-accent'); // highlight picked
    expect(right).toBeEnabled();
  });

  it('click lần 2 → bỏ pick, nút › disabled lại', async () => {
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={[]} />);
    await user.click(screen.getByText('React'));
    expect(screen.getByRole('button', { name: '›' })).toBeEnabled();
    await user.click(screen.getByText('React'));
    expect(screen.getByText('React')).not.toHaveClass('text-accent');
    expect(screen.getByRole('button', { name: '›' })).toBeDisabled();
  });

  it('› → items đã pick chuyển Nguồn→Đích + onChange(source còn lại, target mới) + reset pick', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={TARGET} onChange={onChange} />);
    await user.click(screen.getByText('Vue'));
    await user.click(screen.getByRole('button', { name: '›' }));
    expect(onChange).toHaveBeenCalledWith(
      [SOURCE[0], SOURCE[2]],
      [...TARGET, SOURCE[1]],
    );
    expect(screen.getByRole('button', { name: '›' })).toBeDisabled(); // picked reset
    expect(screen.getByText('Vue')).toBeInTheDocument(); // vẫn trong DOM — giờ ở panel Đích
  });

  it('‹ → item trong Đích chuyển ngược về Nguồn', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PickList source={SOURCE} target={TARGET} onChange={onChange} />);
    await user.click(screen.getByText('Svelte'));
    await user.click(screen.getByRole('button', { name: '‹' }));
    expect(onChange).toHaveBeenCalledWith([...SOURCE, TARGET[0]], []);
    expect(screen.getByRole('button', { name: '‹' })).toBeDisabled();
  });
});
