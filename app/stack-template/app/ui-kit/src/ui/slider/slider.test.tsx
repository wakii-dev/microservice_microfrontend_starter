import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Slider } from './index.js';
afterEach(cleanup);
describe('Slider', () => {
  it('role=slider + aria-valuenow', () => {
    render(<Slider value={50} min={0} max={100} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '50');
  });
  it('range → 2 handles', () => {
    render(<Slider range={[20, 80]} min={0} max={100} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});

describe('Slider — matrix (keyboard/clamp/range/disabled)', () => {
  it('ArrowRight/ArrowUp +step; ArrowLeft/ArrowDown -step', () => {
    const onChange = vi.fn();
    render(<Slider value={50} min={0} max={100} step={10} onChange={onChange} />);
    const track = screen.getByRole('slider');
    fireEvent.keyDown(track, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(60);
    fireEvent.keyDown(track, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(40);
    fireEvent.keyDown(track, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(60);
    fireEvent.keyDown(track, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(40);
  });

  it('clamp min/max khi keyboard vượt cận', () => {
    const onChange = vi.fn();
    render(<Slider value={100} min={0} max={100} step={10} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('range keyboard: →↑ dời cận trên, ←↓ dời cận dưới', () => {
    const onRangeChange = vi.fn();
    render(<Slider range={[20, 80]} min={0} max={100} step={10} onRangeChange={onRangeChange} />);
    const track = screen.getByRole('slider');
    fireEvent.keyDown(track, { key: 'ArrowRight' });
    expect(onRangeChange).toHaveBeenLastCalledWith([20, 90]);
    fireEvent.keyDown(track, { key: 'ArrowLeft' });
    expect(onRangeChange).toHaveBeenLastCalledWith([10, 80]);
  });

  it('disabled → tabIndex -1 + keyboard no-op', () => {
    const onChange = vi.fn();
    render(<Slider value={40} disabled onChange={onChange} />);
    const track = screen.getByRole('slider');
    expect(track).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(track, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('a11y — aria-valuemin/max/label + step không xác nhận (không đụng value)', () => {
    const onChange = vi.fn();
    render(<Slider value={50} min={10} max={90} ariaLabel="Âm lượng" onChange={onChange} />);
    const track = screen.getByRole('slider', { name: 'Âm lượng' });
    expect(track).toHaveAttribute('aria-valuemin', '10');
    expect(track).toHaveAttribute('aria-valuemax', '90');
    fireEvent.keyDown(track, { key: 'Tab' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
