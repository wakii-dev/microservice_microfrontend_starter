// dom — util DOM dùng chung (utils wave 2026-10-18): getScrollParent (dò ancestor
// overflow — cùng logic Affix, export bản dùng chung), getFocusableElements
// (re-export từ useFocusTrap internals — 1 nguồn sự thật selector WAI-ARIA),
// cx merge class điều kiện (thay template-string surgery — anti-pattern AGENTS).

export { getFocusableElements } from '../hooks/useFocusTrap.js';

/** Dò ancestor có overflow-y cuộn được (auto/scroll) — không thấy → window.
 * Đồng bộ logic với Affix (inline style trước cho jsdom, computed sau cho CSS thật). */
export function getScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null;
  while (node) {
    const oy = node.style.overflowY || getComputedStyle(node).overflowY;
    if (oy === 'auto' || oy === 'scroll') return node;
    node = node.parentElement;
  }
  return window;
}

/** Merge class điều kiện — cx('a', cond && 'b', null, 'c') → 'a b c'.
 * Bỏ giá trị falsy, giữ thứ tự truyền vào; chấp nhận cả mảng lồng 1 cấp. */
export function cx(...parts: Array<string | false | null | undefined | Array<string | false | null | undefined>>): string {
  const out: string[] = [];
  for (const part of parts) {
    if (Array.isArray(part)) out.push(cx(...part));
    else if (part) out.push(part);
  }
  return out.join(' ');
}
