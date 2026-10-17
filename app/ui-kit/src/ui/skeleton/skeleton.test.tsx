// Skeleton tests — Tailwind shimmer classes (bp-skeleton cũ đã migrate).
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Skeleton } from './index.js';

afterEach(cleanup);

describe('Skeleton', () => {
  it('wrapper aria-busy + card variant = rounded-xl, mặc định 1 khối', () => {
    const { container } = render(<Skeleton variant="card" />);
    const wrapper = container.querySelector('[aria-busy="true"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelectorAll('.rounded-xl')).toHaveLength(1);
  });

  it('count=N render N khối', () => {
    const { container } = render(<Skeleton variant="row" count={3} />);
    expect(container.querySelectorAll('.h-11')).toHaveLength(3);
  });

  it('shimmer overlay ::after tồn tại qua class overflow-hidden', () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.querySelector('.overflow-hidden')).not.toBeNull();
  });
});
