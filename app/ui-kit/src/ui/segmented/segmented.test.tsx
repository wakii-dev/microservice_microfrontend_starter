// Segmented tests — radiogroup + active + onChange.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Segmented } from './index.js';

afterEach(cleanup);

const OPTIONS = [
  { label: 'Ngày', value: 'day' },
  { label: 'Tuần', value: 'week' },
];

describe('Segmented', () => {
  it('radiogroup + active = value; click → onChange', async () => {
    const onChange = vi.fn();
    render(<Segmented options={OPTIONS} value="day" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Ngày' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Tuần' }));
    expect(onChange).toHaveBeenCalledWith('week');
  });
});

describe('Segmented — branch phụ (Tier 5 sweep)', () => {
  it('className passthrough + item không active class thường', () => {
    const { container } = render(
      <Segmented options={OPTIONS} value="week" className="marker" onChange={vi.fn()} />,
    );
    expect(container.firstElementChild).toHaveClass('marker');
    expect(screen.getByRole('radio', { name: 'Tuần' }).className).toContain('shadow');
  });

  it('role=radiogroup + mọi radio khác aria-checked=false', () => {
    render(<Segmented options={OPTIONS} value="day" onChange={vi.fn()} />);
    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('uncontrolled (không value) → không item nào active; click vẫn onChange payload', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Segmented options={OPTIONS} onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Ngày' })).toHaveAttribute('aria-checked', 'false');
    await user.click(screen.getByRole('radio', { name: 'Tuần' }));
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('options rỗng → radiogroup trống, không radio', () => {
    render(<Segmented options={[]} onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  // ── Case-coverage audit 2026-10-18 (antd parity: disabled option) ──

  it('option disabled → không bấm được, không gọi onChange (antd parity)', async () => {
    const onChange = vi.fn();
    render(
      <Segmented
        options={[
          { label: 'Ngày', value: 'day' },
          { label: 'Khoá', value: 'locked', disabled: true },
        ]}
        value="day"
        onChange={onChange}
      />,
    );
    const locked = screen.getByRole('radio', { name: 'Khoá' });
    expect(locked).toBeDisabled();
    expect(locked).toHaveClass('cursor-not-allowed');
    await userEvent.click(locked);
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Segmented — classNames + style', () => {
  const OPTS = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
  ];

  it('slot root lên radiogroup + item lên button; className sau slot', () => {
    const { container } = render(
      <Segmented options={OPTS} value="day" classNames={{ root: 'slot-root', item: 'slot-item' }} className="user-last" />,
    );
    expect(container.firstElementChild).toHaveClass('slot-root');
    expect(screen.getByText('Day')).toHaveClass('slot-item');
    const root = container.firstElementChild!;
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
  });

  it('style passthrough lên radiogroup', () => {
    const { container } = render(<Segmented options={OPTS} style={{ padding: '2px' }} />);
    expect(container.firstElementChild).toHaveStyle({ padding: '2px' });
  });
});
