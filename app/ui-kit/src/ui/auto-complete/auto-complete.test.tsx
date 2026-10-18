// AutoComplete tests — gõ → suggestion lọc, chọn → onSelect + label, Escape,
// không match, cap 8 suggestions.
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AutoComplete } from './index.js';

const SUGGESTIONS = [
  { label: 'Học TypeScript', value: 'ts' },
  { label: 'Học Rust', value: 'rust' },
  { label: 'Viết test E2E', value: 'e2e' },
];

afterEach(cleanup);

describe('AutoComplete', () => {
  it('gõ → suggestions lọc theo label; không khớp không xuất hiện', async () => {
    const user = userEvent.setup();
    render(<AutoComplete suggestions={SUGGESTIONS} />);
    const input = screen.getByRole('combobox', { name: 'Autocomplete' });
    await user.type(input, 'học');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Học TypeScript' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Học Rust' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Viết test E2E' })).toBeNull();
  });

  it('onChange bắn theo từng keystroke', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<AutoComplete suggestions={SUGGESTIONS} onChange={onChange} />);
    await user.type(screen.getByRole('combobox', { name: 'Autocomplete' }), 'học');
    expect(onChange).toHaveBeenLastCalledWith('học');
  });

  it('chọn suggestion → onSelect(value) + input hiện label + dropdown đóng', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<AutoComplete suggestions={SUGGESTIONS} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Autocomplete' });
    await user.type(input, 'rust');
    // handler nằm ở <button> trong li — click đúng target
    await user.click(within(screen.getByRole('option', { name: 'Học Rust' })).getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('rust');
    expect(input).toHaveValue('Học Rust');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('không match → không listbox', async () => {
    const user = userEvent.setup();
    render(<AutoComplete suggestions={SUGGESTIONS} />);
    await user.type(screen.getByRole('combobox', { name: 'Autocomplete' }), 'zzz');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Escape đóng dropdown (aria-expanded false)', async () => {
    const user = userEvent.setup();
    render(<AutoComplete suggestions={SUGGESTIONS} />);
    const input = screen.getByRole('combobox', { name: 'Autocomplete' });
    await user.type(input, 'học');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('tối đa 8 suggestions hiển thị', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ label: `Task ${i}`, value: String(i) }));
    const user = userEvent.setup();
    render(<AutoComplete suggestions={many} />);
    await user.type(screen.getByRole('combobox', { name: 'Autocomplete' }), 'task');
    expect(screen.getAllByRole('option')).toHaveLength(8);
  });
});
