import '@testing-library/jest-dom/vitest';

// jsdom thiếu matchMedia — thêm no-op nếu test cần (thêm thuộc tính thiếu của MediaQueryList)
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom thiếu IntersectionObserver — framer-motion (whileInView/useInView, landing
// redesign 2026-10-25) đọc global này lúc mount. Stub FIRE NGAY isIntersecting=true:
// nội dung landing luôn "đã vào viewport" trong test — DOM đầy đủ, không kẹt opacity 0.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element): void {
      this.callback([{ isIntersecting: true, target } as unknown as IntersectionObserverEntry], this);
    }
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    IntersectionObserverStub;
}
