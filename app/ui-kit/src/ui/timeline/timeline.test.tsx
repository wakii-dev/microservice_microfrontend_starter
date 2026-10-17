import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Timeline } from './index.js';
afterEach(cleanup);
describe('Timeline', () => {
  it('items + label + rail', () => {
    render(<Timeline items={[
      { key: '1', children: 'Bước 1' },
      { key: '2', color: 'var(--st-done)', children: 'Bước 2', label: '10:00' },
    ]} />);
    expect(screen.getByText('Bước 1')).toBeInTheDocument();
    expect(screen.getByText('Bước 2')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });
});
