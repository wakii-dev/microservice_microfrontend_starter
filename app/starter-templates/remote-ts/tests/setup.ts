import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia; kit components (motion, responsive hooks)
// call it at import/render time. Report "reduce" so animations render instantly
// in tests — page logic is unaffected.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
