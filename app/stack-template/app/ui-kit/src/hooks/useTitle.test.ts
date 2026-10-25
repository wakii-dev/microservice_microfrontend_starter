// Tests useTitle — set title, đổi theo deps, restore khi unmount (default) /
// giữ khi restoreOnUnmount=false.
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useTitle } from './useTitle.js';

const ORIGINAL = document.title;

afterEach(() => {
  cleanup();
  document.title = ORIGINAL;
});

describe('useTitle', () => {
  it('set title; đổi props → title theo; unmount (default) khôi phục title gốc', () => {
    const { rerender, unmount } = renderHook(({ t }) => useTitle(t), { initialProps: { t: 'Trang A' } });
    expect(document.title).toBe('Trang A');

    rerender({ t: 'Trang B' });
    expect(document.title).toBe('Trang B');

    unmount();
    expect(document.title).toBe(ORIGINAL); // restore chain về trước lần set đầu
  });

  it('restoreOnUnmount: false → giữ title sau unmount', () => {
    const { unmount } = renderHook(({ t }) => useTitle(t, { restoreOnUnmount: false }), {
      initialProps: { t: 'Giữ lại' },
    });
    expect(document.title).toBe('Giữ lại');
    unmount();
    expect(document.title).toBe('Giữ lại'); // không restore
  });
});
