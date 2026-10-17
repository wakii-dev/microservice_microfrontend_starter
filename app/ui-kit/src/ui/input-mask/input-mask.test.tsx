import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputMask } from './index.js';
afterEach(cleanup);

describe('InputMask', () => {
  it('mask 999-999: digits fill + dash literal', () => {
    const onChange = vi.fn();
    render(<InputMask mask="999-999" ariaLabel="phone" onChange={onChange} />);
    const input = screen.getByLabelText('phone');
    fireEvent.change(input, { target: { value: '123456' } });
    expect(input).toHaveValue('123-456');
    expect(onChange).toHaveBeenCalledWith('123-456');
  });
  it('mask aa-99: letters + digits', () => {
    const onChange = vi.fn();
    render(<InputMask mask="aa-99" ariaLabel="code" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('code'), { target: { value: 'AB12' } });
    expect(screen.getByLabelText('code')).toHaveValue('AB-12');
  });
});
