import '@testing-library/jest-dom/vitest';

// jsdom thiếu matchMedia — shim dùng thật theo query (AdminLayout hỏi min-width:768px
// qua useMediaQuery để render Sider; tests cần nhánh wide). Same shim shape ui-kit setup.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: /min-width:\s*(?:768px|48rem)/.test(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
