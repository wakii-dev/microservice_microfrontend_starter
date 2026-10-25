// DeferredContent tests — placeholder trước, IO trigger 1 lần, loadOnInit,
// custom placeholder, fallback khi không có IntersectionObserver.
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeferredContent } from './index.js';

class MockIO {
  static instances: MockIO[] = [];
  disconnected = false;
  constructor(
    public cb: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    MockIO.instances.push(this);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn(() => {
    this.disconnected = true;
  });
  trigger(isIntersecting: boolean) {
    act(() => {
      this.cb([{ isIntersecting, target: {} } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    });
  }
}

beforeEach(() => {
  MockIO.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIO);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const last = () => MockIO.instances[MockIO.instances.length - 1]!;

describe('DeferredContent', () => {
  it('chưa thấy → placeholder skeleton (role=status), children ẩn', () => {
    render(
      <DeferredContent>
        <p>Nội dung nặng</p>
      </DeferredContent>,
    );
    // Skeleton wrapper mỗi bone đều role=status → dùng getAllByRole
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(screen.queryByText('Nội dung nặng')).toBeNull();
  });

  it('IO intersect → children hiện + onVisible gọi đúng 1 lần + observer disconnect', () => {
    const onVisible = vi.fn();
    render(
      <DeferredContent onVisible={onVisible}>
        <p>Nội dung nặng</p>
      </DeferredContent>,
    );
    last().trigger(true);
    expect(screen.getByText('Nội dung nặng')).toBeInTheDocument();
    expect(onVisible).toHaveBeenCalledTimes(1);
    expect(last().disconnected).toBe(true);
    // trigger nữa không gọi lại (fired guard)
    last().trigger(true);
    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  it('loadOnInit → children hiện ngay, không tạo observer', () => {
    render(
      <DeferredContent loadOnInit onVisible={() => {}}>
        <p>Nạp ngay</p>
      </DeferredContent>,
    );
    expect(screen.getByText('Nạp ngay')).toBeInTheDocument();
    expect(MockIO.instances).toHaveLength(0);
  });

  it('custom placeholder render thay skeleton mặc định', () => {
    render(
      <DeferredContent placeholder={<div role="status">Đang xếp hàng…</div>}>
        <p>x</p>
      </DeferredContent>,
    );
    expect(screen.getByText('Đang xếp hàng…')).toBeInTheDocument();
  });

  it('không có IntersectionObserver trong môi trường → fallback load luôn', () => {
    vi.unstubAllGlobals();
    render(
      <DeferredContent>
        <p>Fallback</p>
      </DeferredContent>,
    );
    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });
});
