// BusyBox tests — busy/idle switch + variant passthrough.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BusyBox } from './index.js';

afterEach(cleanup);

describe('BusyBox', () => {
  it('busy=true → Skeleton thay content (aria-busy)', () => {
    const { container } = render(
      <BusyBox busy variant="card" count={2}>
        <p>content</p>
      </BusyBox>,
    );
    expect(screen.queryByText('content')).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelectorAll('.rounded-xl')).toHaveLength(2);
  });

  it('busy=false → content render, không skeleton', () => {
    render(
      <BusyBox busy={false}>
        <p>content</p>
      </BusyBox>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });
});
