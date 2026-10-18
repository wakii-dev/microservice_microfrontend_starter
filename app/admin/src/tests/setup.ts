import '@testing-library/jest-dom/vitest';

// jsdom thiếu matchMedia — Sidebar/Menu responsive có thể hỏi (same shim ui-kit setup)
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
