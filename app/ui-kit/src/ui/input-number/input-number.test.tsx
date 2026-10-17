// InputNumber tests — gõ/step/clamp min-max/blur commit.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputNumber } from './index.js';

afterEach(cleanup);

describe('InputNumber', () => {
  it('stepper ▲ tăng theo step + clamp max', async () => {
    const onChange = vi.fn();
    render(<InputNumber ariaLabel="số lượng" value={9} min={0} max={10} step={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tăng' }));
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it('blur commit + clamp min', () => {
    const onChange = vi.fn();
    render(<InputNumber ariaLabel="n" min={0} onChange={onChange} />);
    fireEvent.blur(screen.getByLabelText('n'), { target: { value: '-5' } });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('text rỗng → onChange(null)', () => {
    const onChange = vi.fn();
    render(<InputNumber ariaLabel="n" onChange={onChange} />);
    fireEvent.blur(screen.getByLabelText('n'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
