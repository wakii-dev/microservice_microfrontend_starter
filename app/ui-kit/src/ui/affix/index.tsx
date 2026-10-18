// Affix — antd parity (docs/parity-matrix.md Gap P0): wrapper bám mép container
// khi scroll qua offset. Phần "bám" là position: sticky CSS thuần (không deps,
// không định vị tay — không layout thrash). JS chỉ làm 1 việc: đo trạng thái bám
// trên scroll/resize của container (target, hoặc ancestor overflow auto/scroll
// gần nhất, fallback window) để gọi onChange. onChange chỉ fire khi trạng thái
// ĐỔI — không fire lúc mount (antd chỉ báo khi có chuyển trạng thái).
// Top mode: bám khi rect.top <= offsetTop (sticky top giữ element tại offsetTop).
// Bottom mode: bám khi rect.bottom >= mép đáy container − offsetBottom.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export interface AffixProps {
  children: ReactNode;
  /** px từ đỉnh container khi bám (antd offsetTop) — mặc định 0. */
  offsetTop?: number;
  /** px từ đáy container khi bám (antd offsetBottom) — truyền thì sang bottom mode. */
  offsetBottom?: number;
  /** Callback khi trạng thái bám đổi (true = đang bám). */
  onChange?: (affixed: boolean) => void;
  /** Container scroll cụ thể (antd target) — mặc định tự dò ancestor scrollable, fallback window. */
  target?: () => HTMLElement | Window;
  className?: string;
}

function findScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null;
  while (node) {
    // inline style trước (jsdom không parse Tailwind class), computed sau cho CSS thật
    const oy = node.style.overflowY || getComputedStyle(node).overflowY;
    if (oy === 'auto' || oy === 'scroll') return node;
    node = node.parentElement;
  }
  return window;
}

export function Affix({
  children,
  offsetTop = 0,
  offsetBottom,
  onChange,
  target,
  className,
}: AffixProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [affixed, setAffixed] = useState(false);
  const affixedRef = useRef(false);
  const mode: 'top' | 'bottom' = offsetBottom !== undefined ? 'bottom' : 'top';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const container = target?.() ?? findScrollParent(el);

    function measure(): boolean {
      const rect = el!.getBoundingClientRect();
      if (mode === 'bottom') {
        const edge = container === window
          ? window.innerHeight
          : (container as HTMLElement).getBoundingClientRect().bottom;
        return rect.bottom >= edge - (offsetBottom ?? 0);
      }
      return rect.top <= offsetTop;
    }

    function evaluate() {
      const next = measure();
      if (next === affixedRef.current) return;
      affixedRef.current = next;
      setAffixed(next);
      onChange?.(next);
    }

    container.addEventListener('scroll', evaluate, { passive: true });
    window.addEventListener('resize', evaluate);
    return () => {
      container.removeEventListener('scroll', evaluate);
      window.removeEventListener('resize', evaluate);
    };
  }, [mode, offsetTop, offsetBottom, target, onChange]);

  const style: CSSProperties = mode === 'bottom'
    ? { position: 'sticky', bottom: offsetBottom }
    : { position: 'sticky', top: offsetTop };

  return (
    <div ref={ref} style={style} data-affixed={affixed || undefined} className={className}>
      {children}
    </div>
  );
}
