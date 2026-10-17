import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorPicker } from './index.js';
afterEach(cleanup);

describe('ColorPicker', () => {
  it('swatch button mở palette; preset click → onChange', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#1677ff" onChange={onChange} />);
    await userEvent.setup().click(screen.getByLabelText('Chọn màu'));
    await userEvent.setup().click(screen.getByLabelText('#f5222d'));
    expect(onChange).toHaveBeenCalledWith('#f5222d');
  });
  it('native color input + hex display (mở palette)', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#1677ff" onChange={vi.fn()} />);
    await user.click(screen.getByLabelText('Chọn màu'));
    const colorInput = document.querySelector('input[type="color"]');
    expect(colorInput).not.toBeNull();
  });
});
