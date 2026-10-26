// Knob tests — role=slider aria + keyboard ±1 clamp (drag cần mousemove trên window,
// jsdom không layout — chỉ assert listener gắn được qua mousedown không crash).
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Knob } from './index.js';

afterEach(cleanup);

describe('Knob', () => {
  it('role=slider + aria valuemin/max/now + label', () => {
    render(<Knob value={40} min={0} max={100} ariaLabel="Volume" />);
    const knob = screen.getByRole('slider', { name: 'Volume' });
    expect(knob).toHaveAttribute('aria-valuemin', '0');
    expect(knob).toHaveAttribute('aria-valuemax', '100');
    expect(knob).toHaveAttribute('aria-valuenow', '40');
  });

  it('ArrowUp → onChange(value+1); ArrowDown → value-1', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Knob value={40} onChange={onChange} ariaLabel="K" />);
    const knob = screen.getByRole('slider', { name: 'K' });
    await user.type(knob, '{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(41);
    await user.type(knob, '{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith(39);
  });

  it('clamp tại max: ArrowUp trên value=max → onChange(max)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Knob value={100} max={100} onChange={onChange} ariaLabel="C" />);
    await user.type(screen.getByRole('slider', { name: 'C' }), '{ArrowUp}');
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('default aria-label tiếng Việt khi không truyền', () => {
    render(<Knob value={10} />);
    expect(screen.getByRole('slider', { name: 'Điều khiển giá trị' })).toBeInTheDocument();
  });
});

// ── slots-wave: classNames slot + style passthrough ──

describe('Knob — classNames + style', () => {
  it('slot root lên svg slider; className sau slot', () => {
    render(<Knob value={40} ariaLabel="S" classNames={{ root: 'slot-root' }} className="user-last" />);
    const knob = screen.getByRole('slider', { name: 'S' }) as unknown as SVGElement;
    expect(knob).toHaveClass('slot-root');
    const cls = knob.className.baseVal;
    expect(cls.indexOf('slot-root')).toBeLessThan(cls.indexOf('user-last'));
  });

  it('style passthrough lên svg (keyboard vẫn đổi giá trị)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Knob value={40} onChange={onChange} ariaLabel="St" style={{ margin: '8px' }} />);
    const knob = screen.getByRole('slider', { name: 'St' }) as unknown as SVGElement;
    expect(knob).toHaveStyle({ margin: '8px' });
    await user.type(knob, '{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(41);
  });
});
