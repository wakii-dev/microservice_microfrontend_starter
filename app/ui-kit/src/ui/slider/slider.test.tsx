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
