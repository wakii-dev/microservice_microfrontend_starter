// Switch tests — toggle, role=switch, aria-checked, size, children, disabled.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Switch } from './index.js';

afterEach(cleanup);

describe('Switch', () => {
  it('role=switch + aria-checked; click toggle onChange', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} aria-label="Bật" />);
    const sw = screen.getByRole('switch', { name: 'Bật' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.setup().click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('checked hiển thị children checked', () => {
    render(<Switch checked checkedChildren="Bật" unCheckedChildren="Tắt" />);
    expect(screen.getByText('Bật')).toBeInTheDocument();
  });

  it('size small + disabled', () => {
    render(<Switch size="small" disabled onChange={vi.fn()} aria-label="s" />);
    expect(screen.getByRole('switch', { name: 's' })).toBeDisabled();
  });
});

describe('Switch — branch phụ (knob children unchecked)', () => {
  it('unchecked hiển thị unCheckedChildren', () => {
    render(<Switch checked={false} unCheckedChildren="Tắt" />);
    expect(screen.getByText('Tắt')).toBeInTheDocument();
  });
});

describe('Switch — branch phụ (Tier 5 sweep)', () => {
  it('size default checkedChildren/unCheckedChildren render theo state', async () => {
    const { rerender } = render(<Switch checked unCheckedChildren="Tắt" checkedChildren="Bật" />);
    expect(screen.getByText('Bật')).toBeInTheDocument();
    rerender(<Switch checked={false} unCheckedChildren="Tắt" checkedChildren="Bật" />);
    expect(screen.getByText('Tắt')).toBeInTheDocument();
  });
});

describe('Switch — batch ⑳ redesign (iOS/MUI-grade)', () => {
  it('dark-safe: unchecked bg-ink/25, KHÔNG còn rgba(0,0,0 cứng', () => {
    render(<Switch aria-label="ds" />);
    const sw = screen.getByRole('switch', { name: 'ds' });
    expect(sw.className).toContain('bg-ink/25');
    expect(sw.className).not.toContain('rgba(0,0,0');
    // gradient layer luôn tồn tại, checked mới opacity-100
    const grad = sw.querySelector('span.bg-gradient-to-r')!;
    expect(grad).not.toBeNull();
    expect(grad.className).toContain('opacity-0');
  });

  it('checked → gradient layer opacity-100 (accent→accent-hi)', () => {
    render(<Switch checked aria-label="gr" />);
    const grad = screen.getByRole('switch', { name: 'gr' }).querySelector('span.bg-gradient-to-r')!;
    expect(grad).not.toBeNull();
    expect(grad.className).toContain('opacity-100');
    expect(grad.className).toContain('from-accent');
    expect(grad.className).toContain('to-accent-hi');
  });

  it('pop animation class xuất hiện sau click (bp-switch-pop)', () => {
    render(<Switch onChange={vi.fn()} aria-label="pop" />);
    const sw = screen.getByRole('switch', { name: 'pop' });
    const handle = () => sw.querySelector('span.z-10')!.className;
    expect(handle()).not.toContain('bp-switch-pop');
    fireEvent.click(sw);
    expect(handle()).toContain('bp-switch-pop');
  });

  it('handle: spring class + group-active:scale-105 + shadow 2 lớp (disabled thì phẳng)', () => {
    const { rerender } = render(<Switch aria-label="hd" />);
    const handleOf = () => screen.getByRole('switch', { name: 'hd' }).querySelector('span.z-10')!;
    let hd = handleOf();
    expect(hd.className).toContain('group-active:scale-105');
    expect(hd.className).toContain('ease-[cubic-bezier(0.34,1.56,0.64,1)]');
    expect(hd.className).toContain('shadow-[');
    rerender(<Switch aria-label="hd" disabled />);
    hd = handleOf();
    expect(hd.className).not.toContain('shadow-[');
    expect(screen.getByRole('switch', { name: 'hd' }).className).toContain('opacity-50');
  });

  it('focus-visible ring đồng bộ Button (ring-2 ring-accent/40 offset-2)', () => {
    render(<Switch aria-label="fv" />);
    const sw = screen.getByRole('switch', { name: 'fv' });
    expect(sw.className).toContain('focus-visible:ring-2');
    expect(sw.className).toContain('focus-visible:ring-accent/40');
    // KHÔNG ring-offset — khe trắng quanh track tạo cảm giác viền đôi (feedback user ảnh)
    expect(sw.className).not.toContain('ring-offset');
    expect(sw.className).not.toContain('focus-visible:outline');
  });
});

describe('Switch — classNames slots + style (SÓNG-3)', () => {
  it('slots lên đúng element: root→button track, handle→span knob', () => {
    render(
      <Switch
        checked
        aria-label="slot"
        classNames={{ root: 'slot-root', handle: 'slot-handle' }}
      />,
    );
    const sw = screen.getByRole('switch', { name: 'slot' });
    expect(sw).toHaveClass('slot-root');
    expect(sw.querySelector('span.z-10')).toHaveClass('slot-handle');
  });

  it('style passthrough + click vẫn onChange; className người dùng sau root slot', async () => {
    const onChange = vi.fn();
    render(
      <Switch
        aria-label="st"
        style={{ margin: '4px' }}
        classNames={{ root: 'slot-root' }}
        className="user-last"
        onChange={onChange}
      />,
    );
    const sw = screen.getByRole('switch', { name: 'st' });
    expect(sw).toHaveStyle({ margin: '4px' });
    expect(sw.className.indexOf('slot-root')).toBeLessThan(sw.className.indexOf('user-last'));
    await userEvent.setup().click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
