import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Listbox } from './index.js';
afterEach(cleanup);

const OPTIONS = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b', disabled: true },
];

describe('Listbox', () => {
  it('role=listbox + options; click → onChange; disabled → không', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Listbox options={OPTIONS} value="a" onChange={onChange} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toHaveClass('font-semibold');
    await user.click(screen.getByText('Option B'));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByText('Option A'));
    expect(onChange).toHaveBeenCalledWith('a');
  });
});

// ── Coverage audit additions ─────────────────────────────────────────────────────
describe('Listbox — coverage audit', () => {
  it('aria-selected trên option; chọn option khác → onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Listbox options={OPTIONS} value="a" onChange={onChange} />);
    expect(screen.getByRole('option', { name: 'Option A' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Option B' })).toHaveAttribute('aria-selected', 'false');
    await user.click(screen.getByText('Option A'));
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('disabled option → style khoá (cursor-not-allowed) + không chọn được (kể cả click nhiều lần)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Listbox options={OPTIONS} value="a" onChange={onChange} />);
    const disabled = screen.getByRole('option', { name: 'Option B' });
    // NOTE: component chưa render aria-disabled (a11y gap — chỉ signal bằng style)
    expect(disabled.className).toContain('cursor-not-allowed');
    await user.click(disabled);
    await user.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Listbox — classNames + style', () => {
  const OPTS = [
    { label: 'Alpha', value: 'a' },
    { label: 'Beta', value: 'b' },
  ];

  it('slot root lên ul + option lên li; className sau slot', () => {
    const { container } = render(
      <Listbox options={OPTS} value="a" classNames={{ root: 'slot-root', option: 'slot-opt' }} className="user-last" />,
    );
    const ul = container.firstElementChild!;
    expect(ul).toHaveClass('slot-root');
    expect(ul.className.indexOf('slot-root')).toBeLessThan(ul.className.indexOf('user-last'));
    expect(screen.getByText('Alpha').closest('li')).toHaveClass('slot-opt');
    expect(screen.getByText('Beta').closest('li')).toHaveClass('slot-opt');
  });

  it('style passthrough lên ul', () => {
    const { container } = render(<Listbox options={OPTS} style={{ padding: '2px' }} />);
    expect(container.firstElementChild).toHaveStyle({ padding: '2px' });
  });
});
