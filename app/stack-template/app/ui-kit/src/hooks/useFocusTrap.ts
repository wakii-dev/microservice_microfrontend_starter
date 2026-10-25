// useFocusTrap — khoá focus trong container (modal/drawer, batch ⑫ worker C):
// - kích hoạt: capture document.activeElement (trigger) → focus phần tử focusable đầu
// - Tab/Shift+Tab: vòng trong container (querySelector focusable chuẩn WAI-ARIA)
// - kết thúc (active=false): TRẢ FOCUS về trigger đã capture
// Không dep ngoài. active nên = open && mounted (mounted=false do exit animation
// chưa xong vẫn trả focus sớm — đúng thời điểm dialog "đóng" về mặt tương tác).
import { useEffect, type RefObject } from 'react';

/** Focusable selector chuẩn: input, button, select, textarea, a[href], tabIndex>=0. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previous = document.activeElement as HTMLElement | null;

    // Mở → focus phần tử đầu (không có focusable → focus chính container)
    const items = getFocusableElements(container);
    (items[0] ?? container).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        // Dialog không focusable nào bên trong (vd image preview chỉ có img) —
        // giữ focus trên container, KHÔNG cho Tab thoát ra ngoài (WAI-ARIA modal).
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      const inside = current instanceof Node && container.contains(current);
      if (e.shiftKey) {
        // Shift+Tab ở phần tử đầu (hoặc focus đang ở ngoài) → vòng về cuối
        if (current === first || !inside) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !inside) {
        // Tab ở phần tử cuối (hoặc ngoài) → vòng về đầu
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.(); // đóng → trả focus về trigger
    };
  }, [active, ref]);
}
