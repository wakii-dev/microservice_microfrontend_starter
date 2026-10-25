// Tests dom — getScrollParent (tìm ancestor cuộn được/null), getFocusableElements
// (đúng selector + thứ tự DOM + bỏ disabled/tabindex -1), cx (bỏ falsy).
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { cx, getFocusableElements, getScrollParent } from './dom.js';

afterEach(cleanup);

describe('getScrollParent', () => {
  it('tìm ancestor có overflow-y auto/scroll gần nhất', () => {
    const { container } = render(
      <div style={{ overflowY: 'auto' }} data-testid="scroller">
        <div style={{ overflowY: 'visible' }}>
          <span data-testid="leaf">x</span>
        </div>
      </div>,
    );
    const leaf = container.querySelector('[data-testid="leaf"]') as HTMLElement;
    const scroller = container.querySelector('[data-testid="scroller"]') as HTMLElement;
    expect(getScrollParent(leaf)).toBe(scroller);
  });

  it('không có ancestor cuộn được → null', () => {
    const { container } = render(
      <div>
        <span data-testid="leaf2">x</span>
      </div>,
    );
    const leaf = container.querySelector('[data-testid="leaf2"]') as HTMLElement;
    // body trong jsdom không set overflow — đi hết → null
    expect(getScrollParent(leaf)).toBeNull();
  });
});

describe('getFocusableElements', () => {
  it('thu theo thứ tự DOM, bỏ disabled + tabindex=-1', () => {
    const { container } = render(
      <div>
        <button data-name="btn">b</button>
        <a href="#x" data-name="link">
          l
        </a>
        <button disabled data-name="disabled">
          d
        </button>
        <div tabIndex={-1} data-name="neg">
          n
        </div>
        <div tabIndex={0} data-name="tab0">
          t
        </div>
      </div>,
    );
    const got = getFocusableElements(container as HTMLElement).map((el) => el.getAttribute('data-name'));
    expect(got).toEqual(['btn', 'link', 'tab0']);
  });

  it('container rỗng → []', () => {
    const { container } = render(<div />);
    expect(getFocusableElements(container as HTMLElement)).toEqual([]);
  });
});

describe('cx', () => {
  it('nối class thật, bỏ false/null/undefined', () => {
    expect(cx('a', false && 'b', undefined, 'c', null)).toBe('a c');
    expect(cx()).toBe('');
  });
});
