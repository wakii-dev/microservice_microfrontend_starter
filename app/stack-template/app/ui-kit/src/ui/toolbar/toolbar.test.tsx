import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Toolbar } from './index.js';
afterEach(cleanup);
describe('Toolbar', () => {
  it('children + extra render', () => {
    render(<Toolbar extra={<span>extra</span>}>main</Toolbar>);
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('extra')).toBeInTheDocument();
  });
});
