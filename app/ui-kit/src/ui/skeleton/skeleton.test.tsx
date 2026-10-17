// Tests Skeleton — hand-off §3.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Skeleton } from './index.js';

afterEach(() => {
  cleanup();
});

describe('Skeleton (hand-off §3)', () => {
  it('wrapper aria-busy + đúng class variant, mặc định 1 khối', () => {
    render(<Skeleton variant="card" />);

    const wrapper = document.querySelector('[aria-busy="true"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelectorAll('.bp-skeleton--card')).toHaveLength(1);
  });

  it('count=N render N khối', () => {
    render(<Skeleton variant="row" count={3} />);

    expect(document.querySelectorAll('.bp-skeleton--row')).toHaveLength(3);
  });
});
