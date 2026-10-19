// dom tests — getScrollParent (nested overflow + fallback window), getFocusableElements
// (filter disabled + tabindex -1), cx merge điều kiện.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { cx, getFocusableElements, getScrollParent } from './dom.js';

afterEach(cleanup);

describe('getScrollParent', () => {
  it('dò ancestor overflow-y auto (inline style — jsdom)', () => {
    const { container } = render(
      <div style={{ overflowY: 'auto', height: 100 }}>
        <div>
          <div data-testid="inner">deep</div>
        </div>
      </div>,
    );
    const inner = container.querySelector('[data-testid="inner"]') as HTMLElement;
    const parent = getScrollParent(inner);
    expect(parent).toBe(container.firstElementChild);
  });

  it('không có ancestor cuộn được → window', () => {
    const { container } = render(<div><div data-testid="plain">plain</div></div>);
    const inner = container.querySelector('[data-testid="plain"]') as HTMLElement;
    expect(getScrollParent(inner)).toBe(window);
  });

  it('el null → window (không ném)', () => {
    expect(getScrollParent(null)).toBe(window);
  });
});

describe('getFocusableElements', () => {
  it('lấy button/input/a[href]; BỎ disabled + tabindex -1; giữ thứ tự DOM', () => {
    const { container } = render(
      <div>
        <button type="button">one</button>
        <button type="button" disabled>disabled</button>
        <a href="#x">link</a>
        <input aria-label="text" />
        <span tabIndex={-1}>skip</span>
        <span tabIndex={0}>zero</span>
      </div>,
    );
    const els = getFocusableElements(container.firstElementChild as HTMLElement);
    expect(els.map((e) => e.textContent ?? e.tagName)).toEqual(['one', 'link', '', 'zero']);
  });

  it('container rỗng → mảng rỗng', () => {
    const { container } = render(<div />);
    expect(getFocusableElements(container.firstElementChild as HTMLElement)).toEqual([]);
  });

  it('chỉ lấy trong container: element ngoài scope không bị quét; select/textarea đủ điều kiện', () => {
    const { container } = render(
      <div>
        <select aria-label="chọn" />
        <textarea aria-label="mô tả" defaultValue="x" />
        <div data-testid="scope">
          <button type="button">inside</button>
        </div>
      </div>,
    );
    const scope = container.querySelector('[data-testid="scope"]') as HTMLElement;
    const els = getFocusableElements(scope);
    expect(els.length).toBe(1);
    expect(els[0]!.textContent).toBe('inside');
    // select/textarea trong container gốc vẫn đủ điều kiện (selector WAI-ARIA)
    const all = getFocusableElements(container.firstElementChild as HTMLElement);
    expect(all.some((e) => e.tagName === 'SELECT')).toBe(true);
    expect(all.some((e) => e.tagName === 'TEXTAREA')).toBe(true);
  });
});

describe('cx', () => {
  it('merge điều kiện: bỏ false/null/undefined, giữ thứ tự', () => {
    expect(cx('a', false && 'b', null, 'c', undefined)).toBe('a c');
    expect(cx('base', true && 'active')).toBe('base active');
  });

  it('mảng lồng 1 cấp + rỗng → chuỗi sạch không space thừa', () => {
    expect(cx(['x', 'y'], false ? 'z' : null)).toBe('x y');
    expect(cx(false, null, undefined, '')).toBe('');
  });

  it('mảng lồng bên trong mảng khác (đệ quy) + không dedupe', () => {
    expect(cx('a', ['b', false ? 'c' : false], ['d'], 'e')).toBe('a b d e');
    expect(cx('a', 'a', ['a'])).toBe('a a a');
  });
});
