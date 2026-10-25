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

// jsdom KHÔNG chạy CSS animation → `animationend` không bao giờ fire → Modal
// (ui-kit: đóng qua onAnimationEnd sau class animate-[bp-fade-out/bp-zoom-out])
// treo trong DOM mãi sau khi close. Observer này giả lập hệ máy animation:
// element nhận class `animate-[…]` → tự bắn animationend sau 1 tick (~30ms —
// đủ cho React commit, không nhanh đến mức nuốt enter animation logic).
// Chỉ fire 1 lần mỗi lần class đổi — không loop (dispatch không đổi class).
{
  const fire = (target: Element) => {
    window.setTimeout(() => {
      target.dispatchEvent(new Event('animationend', { bubbles: true }));
    }, 30);
  };
  const seen = new WeakMap<Element, string>();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const el = mutation.target as Element;
      const cls = el.className;
      if (typeof cls === 'string' && cls.includes('animate-[') && seen.get(el) !== cls) {
        seen.set(el, cls);
        fire(el);
      }
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
}
