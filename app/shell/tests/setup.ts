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
