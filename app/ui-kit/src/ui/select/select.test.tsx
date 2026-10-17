// Select tests — trigger/open/option select/keyboard/disabled (aria combobox+listbox).
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Select } from './index.js';

const OPTIONS = [
  { label: 'Cần làm', value: 'todo' },
  { label: 'Đang làm', value: 'in_progress' },
  { label: 'Xong', value: 'done' },
];

afterEach(cleanup);

describe('Select', () => {
  it('trigger combobox aria-label + aria-expanded=false; value hiển thị label', () => {
    render(<Select ariaLabel="Trạng thái task X" options={OPTIONS} value="in_progress" />);
    const trigger = screen.getByRole('combobox', { name: 'Trạng thái task X' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('Đang làm');
  });

  it('placeholder khi không value', () => {
    render(<Select ariaLabel="S" options={OPTIONS} placeholder="Chọn…" />);
    expect(screen.getByRole('combobox', { name: 'S' })).toHaveTextContent('Chọn…');
  });

  it('open → listbox role=option ×3; chọn → onChange + đóng', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select ariaLabel="S" options={OPTIONS} value="todo" onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'S' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Xong' }));
    expect(onChange).toHaveBeenCalledWith('done');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keyboard: ArrowDown mở + di chuyển active; Enter chọn', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select ariaLabel="K" options={OPTIONS} value="todo" onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'K' });
    await user.click(trigger);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('in_progress');
  });

  it('disabled → không mở được', async () => {
    const user = userEvent.setup();
    render(<Select ariaLabel="D" options={OPTIONS} disabled />);
    await user.click(screen.getByRole('combobox', { name: 'D' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('disabled option → không commit', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select
        ariaLabel="DO"
        options={[...OPTIONS, { label: 'Khoá', value: 'locked', disabled: true }]}
        value="todo"
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('combobox', { name: 'DO' }));
    await user.click(screen.getByRole('option', { name: 'Khoá' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

describe('Select — branch phụ', () => {
  it('Escape đóng listbox', async () => {
    const user = userEvent.setup();
    render(<Select ariaLabel="E" options={OPTIONS} />);
    await user.click(screen.getByRole('combobox', { name: 'E' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('value không nằm trong options → mở tại active 0 (clamp)', async () => {
    const user = userEvent.setup();
    render(<Select ariaLabel="C" options={OPTIONS} value="không-tồn-tại" />);
    await user.click(screen.getByRole('combobox', { name: 'C' }));
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });
});
