// useTitle tests — đặt title, cập nhật khi đổi, restore khi unmount (opt-in).
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useTitle } from './useTitle.js';

const ORIGINAL = document.title;
afterEach(() => {
  document.title = ORIGINAL;
});

describe('useTitle', () => {
  it('đặt document.title lúc mount', () => {
    renderHook(() => useTitle('Trang — Orca'));
    expect(document.title).toBe('Trang — Orca');
  });

  it('title prop đổi → document.title theo (re-render với title mới)', () => {
    const { rerender } = renderHook(({ title }) => useTitle(title), { initialProps: { title: 'A' } });
    rerender({ title: 'B' });
    rerender({ title: 'C' });
    expect(document.title).toBe('C');
  });

  it('restoreOnUnmount=true → trả title trước khi mount; mặc định giữ nguyên', () => {
    const original = document.title;
    const { unmount } = renderHook(() => useTitle('Tạm', true));
    expect(document.title).toBe('Tạm');
    unmount();
    expect(document.title).toBe(original);

    const { unmount: unmount2 } = renderHook(() => useTitle('Giữ lại'));
    unmount2();
    expect(document.title).toBe('Giữ lại'); // mặc định không restore
  });
});
