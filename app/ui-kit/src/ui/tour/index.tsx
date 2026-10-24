// Tour — guided spotlight tour (antd Tour lite, P1): mask khoét lỗ quanh target
// (getBoundingClientRect + padding, vẽ SVG path fill-rule evenodd), panel step
// (title/description + prev/next/finish). Không target → panel căn giữa màn
// hình (bước intro/outro). ESC / click mask = đóng; scroll/resize tự re-measure.
// A11y (pattern Modal): role=dialog + useFocusTrap — mở → focus panel, Tab vòng
// trong, đóng → trả focus về trigger. Motion: bp-fade-in mask + bp-zoom-in panel.
// Depth contract 2026-10-19: panel nổi bậc L3 — hairline border + ele-3 (inset
// highlight) chồng shadow-pop + wash sheen + easing --ease-smooth.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../button/index.js';
import { Icon } from '../icons/index.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';

/** 1 bước tour — bỏ `target` → panel căn giữa (giới thiệu/kết thúc kiểu antd). */
export interface TourStep {
  /** Element cần spotlight: CSS selector | element | ref. */
  target?: string | HTMLElement | RefObject<HTMLElement | null>;
  title?: ReactNode;
  description?: ReactNode;
}

export interface TourProps {
  /** Danh sách bước (thứ tự hiển thị). */
  steps: TourStep[];
  /** Mở/tắt tour. */
  open: boolean;
  /** Đóng (ESC, click mask, nút ×, nút Finish bước cuối). */
  onClose: () => void;
  /** Bước hiện tại (controlled). Bỏ → tour tự quản internal. */
  current?: number;
  /** Gọi khi prev/next đổi bước (dùng cùng `current` controlled). */
  onCurrentChange?: (index: number) => void;
  className?: string;
}

/** Đệm quanh element được spotlight. */
const SPOTLIGHT_PAD = 8;
/** Góc bo lỗ spotlight (khớp radius token controls). */
const SPOTLIGHT_RADIUS = 8;
/** Bề rộng panel — hằng số để clamp ngang không cần đo. */
const PANEL_WIDTH = 320;
/** Ước lượng cao panel cho heuristic trên/dưới. */
const PANEL_EST_HEIGHT = 220;
const GAP = 12;

type Rect = { top: number; left: number; width: number; height: number; bottom: number };

function resolveTarget(target: TourStep['target']): HTMLElement | null {
  if (!target) return null;
  if (typeof target === 'string') return document.querySelector<HTMLElement>(target);
  if (target instanceof HTMLElement) return target;
  return target.current;
}

/** Lỗ khoét: rect target + padding, clamp >= 0 (jsdom/element 0×0 vẫn vẽ được). */
function holeRect(rect: Rect): Rect {
  const top = Math.max(0, rect.top - SPOTLIGHT_PAD);
  const height = Math.max(0, rect.height + SPOTLIGHT_PAD * 2);
  return {
    left: Math.max(0, rect.left - SPOTLIGHT_PAD),
    top,
    width: Math.max(0, rect.width + SPOTLIGHT_PAD * 2),
    height,
    bottom: top + height,
  };
}

/** SVG path: chữ nhật full + lỗ bo góc (evenodd → lỗ trong suốt). */
function maskPath(view: { w: number; h: number }, hole: Rect | null): string {
  let d = `M0 0 H${view.w} V${view.h} H0 Z`;
  if (hole && hole.width > 0 && hole.height > 0) {
    const r = Math.min(SPOTLIGHT_RADIUS, hole.width / 2, hole.height / 2);
    const { left: x, top: y, width: w, height: h } = hole;
    d += ` M${x + r} ${y} h${w - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - 2 * r}`
      + ` a${r} ${r} 0 0 1 -${r} ${r} h${-(w - 2 * r)} a${r} ${r} 0 0 1 -${r} -${r}`
      + ` v${-(h - 2 * r)} a${r} ${r} 0 0 1 ${r} -${r} Z`;
  }
  return d;
}

export function Tour({ steps, open, onClose, current, onCurrentChange, className }: TourProps) {
  const [inner, setInner] = useState(0);
  const [view, setView] = useState({ w: 0, h: 0 });
  const [rect, setRect] = useState<Rect | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const index = Math.max(0, Math.min(current ?? inner, steps.length - 1));

  // Mở lại tour → internal current về 0 (controlled `current` do consumer quyết)
  useEffect(() => {
    if (open) setInner(0);
  }, [open]);

  // ESC đóng (chỉ khi open — như Modal)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useFocusTrap(panelRef, open);

  // Kích thước viewport + rect target — re-measure khi scroll (capture bắt cả
  // scroll container trong trang) / resize trong lúc tour mở.
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      setView({ w: window.innerWidth, h: window.innerHeight });
      const el = resolveTarget(steps[index]?.target);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    document.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      document.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open, index, steps]);

  if (!open || steps.length === 0) return null;

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(next, steps.length - 1));
    if (current === undefined) setInner(clamped);
    onCurrentChange?.(clamped);
  };

  // Panel: ưu tiên dưới target, thiếu chỗ → trên, hẹp cả 2 → dính mép trên.
  let panelStyle: CSSProperties;
  if (rect) {
    const cx = rect.left + rect.width / 2;
    const left = Math.max(8, Math.min(cx - PANEL_WIDTH / 2, view.w - PANEL_WIDTH - 8));
    panelStyle =
      rect.bottom + GAP + PANEL_EST_HEIGHT < view.h
        ? { left, top: rect.bottom + GAP }
        : { left, bottom: Math.max(8, view.h - rect.top + GAP) };
  } else {
    panelStyle = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  }

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const slot = className ? ` ${className}` : '';

  return createPortal(
    <div
      data-testid="tour-overlay"
      onClick={onClose}
      className={`fixed inset-0 z-[var(--z-modal)] animate-[bp-fade-in_var(--motion-base)_var(--ease-smooth)]${slot}`}
    >
      <svg
        data-testid="tour-spotlight"
        width={view.w}
        height={view.h}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <path d={maskPath(view, rect ? holeRect(rect) : null)} fill="var(--mask)" fillRule="evenodd" />
      </svg>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof step?.title === 'string' ? step.title : 'Product tour'}
        tabIndex={-1}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        className="absolute w-[320px] rounded-xl border border-line bg-s2 p-4 shadow-[var(--shadow-pop),var(--ele-3)] [background-image:var(--wash)] outline-none animate-[bp-zoom-in_var(--motion-base)_var(--ease-smooth)]"
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="pt-0.5 font-mono text-meta text-ink3">
            {index + 1} / {steps.length}
          </span>
          <button
            type="button"
            aria-label="Close tour"
            className="cursor-pointer rounded-1 border-none bg-transparent p-1 text-base leading-3 text-ink3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            onClick={onClose}
          >
            <Icon name="times" size={14} />
          </button>
        </div>
        {step?.title && <div className="text-h3 font-semibold text-ink">{step.title}</div>}
        {step?.description && <div className="mt-1 text-body text-ink2">{step.description}</div>}
        <div className="mt-4 flex items-center gap-2">
          <Button disabled={index === 0} onClick={() => go(index - 1)}>
            Prev
          </Button>
          <Button type="primary" onClick={() => (isLast ? onClose() : go(index + 1))}>
            {isLast ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
