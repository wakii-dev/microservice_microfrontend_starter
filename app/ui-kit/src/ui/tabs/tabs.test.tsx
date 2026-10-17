// Tabs tests — tablist/tab/tabpanel + disabled + onChange.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tabs } from './index.js';

const ITEMS = [
  { key: 't1', label: 'Tab một', children: <p>Nội dung một</p> },
  { key: 't2', label: 'Tab hai', children: <p>Nội dung hai</p> },
  { key: 't3', label: 'Tab khoá', children: <p>chưa tới</p>, disabled: true },
];

afterEach(cleanup);

describe('Tabs', () => {
  it('tablist + active mặc định item đầu + panel content', () => {
    render(<Tabs items={ITEMS} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByText('Nội dung một')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung hai')).toBeNull();
  });

  it('click tab → onChange (uncontrolled activeKey — consumer controlled)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Tab hai' }));
    expect(onChange).toHaveBeenCalledWith('t2');
  });

  it('disabled tab → không click được', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Tabs items={ITEMS} onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Tab khoá' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
