// dom — helper DOM dùng chung (0 deps): scroll parent · focusable · className.
// ⚠️ getFocusableElements dùng CÙNG selector chuẩn WAI-ARIA với
// src/hooks/useFocusTrap.ts (file đó ngoài scope sửa — bản này copy selector,
// comment dẫn nguồn; lead có thể hợp nhất sau qua re-export).

/** Focusable selector chuẩn WAI-ARIA — nhất quán với hooks/useFocusTrap.ts. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Tìm ancestor cuộn được theo trục dọc (overflow-y auto/scroll) — đi từ
 * parentElement lên; không thấy → null (caller fallback window/document). */
export function getScrollParent(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return current;
    current = current.parentElement;
  }
  return null;
}

/** Danh sách phần tử nhận focus trong container (thứ tự DOM) — selector chuẩn
 * WAI-ARIA, khớp useFocusTrap. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** Nối className có điều kiện — bỏ falsy: cx('a', cond && 'b', null) → "a b". */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
