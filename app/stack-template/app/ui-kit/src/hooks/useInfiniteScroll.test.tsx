// Tests useInfiniteScroll — sentinel ATTACH thật: vào viewport → load 1 lần mỗi
// lượt; loading guard chống gọi chồng khi promise chưa xong; disabled chặn IO.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInfiniteScroll, type UseInfiniteScrollOptions } from './useInfiniteScroll.js';

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let lastCallback: IOCallback | null = null;

class MockIntersectionObserver {
  constructor(cb: IOCallback) {
    lastCallback = cb;
  }
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

function fireIntersecting(isIntersecting: boolean) {
  lastCallback?.([{ isIntersecting }]);
}

function Probe(props: UseInfiniteScrollOptions) {
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(props);
  return <div ref={sentinelRef} data-testid="sentinel" />;
}

afterEach(() => {
  cleanup();
  lastCallback = null;
  vi.unstubAllGlobals();
});

describe('useInfiniteScroll', () => {
  it('sentinel vào viewport → gọi onLoadMore; xong load có thể gọi lượt kế', async () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const onLoadMore = vi.fn().mockResolvedValue(undefined);
    render(<Probe onLoadMore={onLoadMore} />);
    fireIntersecting(true);
    await Promise.resolve();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    fireIntersecting(true); // lần trước đã xong → lượt mới hợp lệ
    await Promise.resolve();
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('loading guard: promise chưa xong → KHÔNG gọi chồng', async () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const holder: { resolve?: () => void } = {};
    const onLoadMore = vi.fn().mockImplementation(
      () =>
        new Promise<void>((r) => {
          holder.resolve = r;
        }),
    );
    render(<Probe onLoadMore={onLoadMore} />);
    fireIntersecting(true);
    fireIntersecting(true);
    fireIntersecting(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    holder.resolve?.();
    await Promise.resolve();
  });

  it('disabled=true → không tạo IO, không gọi', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const onLoadMore = vi.fn();
    render(<Probe onLoadMore={onLoadMore} disabled />);
    expect(lastCallback).toBeNull();
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
