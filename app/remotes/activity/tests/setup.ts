import '@testing-library/jest-dom/vitest';

// Motion redesign (remotes wave): suite chạy nặng → jsdom rAF throttle → framer
// exit animation không hoàn tất kịp trong window waitFor. Stub matchMedia báo
// prefers-reduced-motion: reduce → MotionConfig reducedMotion="user" render
// INSTANT (animation skip) — page logic không đổi, exit/mount tức thì.
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
