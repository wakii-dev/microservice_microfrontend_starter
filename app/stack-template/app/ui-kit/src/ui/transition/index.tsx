// Transition — họ enter/exit kiểu MUI (motion-effects W8, 0 deps) — 11 loại:
//   Fade (opacity) · Zoom (scale .96) · Collapse (grid 0fr↔1fr, orientation
//   vertical|horizontal) · Slide (4 hướng) · Grow (scale từ gốc origin) · Flip
//   (rotateY 3D) · Rotate (đơn trục) · Blur (filter+opacity) · Bounce (overshoot)
//   · ScaleSoft (scale nhẹ) · Stagger (children delay nối tiếp) · Crossfade
//   (swap 2 children opacity).
// API thống nhất: `in?` · `duration?` · `delay?` · `easing?` (mặc định token
// --ease-smooth — depth contract 2026-10-19: 200-280ms, vào mềm dừng không giật)
// · `unmountOnExit?` + prop riêng: Slide.direction · Grow.origin ·
// Collapse.orientation · Stagger.staggerMs · Crossfade.active.
// Keyframe bằng token (styles/tailwind.css, khối motion). Exit của loại mới =
// REVERSE của enter (animationDirection) — không đúc keyframe out. Class giữ
// LITERAL (Tailwind quét được — cấm nội suy chuỗi class). prefers-reduced-motion
// tự tắt nhờ block global (end-event vẫn fire tức thì nên exit-machine vẫn đúng).
// unmountOnExit (mặc định true): exit chạy XONG mới unmount (state machine kiểu
// Modal); false → giữ DOM ẩn bằng opacity-0/invisible.
// ── Chọn loại nào khi nào ────────────────────────────────────────────────
//   Fade: mặc định an toàn         · Zoom: card/dialog pop
//   Collapse dọc: FAQ/accordion    · Collapse ngang: sidebar/mở cột
//   Slide: drawer/panel theo mép   · Grow: menu/popover mọc từ trigger
//   Flip: đổi mặt thẻ/lượt xem     · Rotate: icon/badge quay vào
//   Blur: hero/ảnh focus-in        · Bounce: điểm thưởng/success pop
//   ScaleSoft: hover-inRegion nhẹ  · Stagger: list/grid mount nối tiếp
//   Crossfade: swap 2 trạng thái cùng chỗ (tab ảnh, 2 mode xem)
import { useEffect, useState,
  type AnimationEvent,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent } from 'react';

export interface TransitionProps {
  /** Hiện (enter) / ẩn (exit) — bỏ qua mặc định là hiện. */
  in?: boolean;
  /** Exit xong unmount khỏi DOM (mặc định true); false → giữ DOM ở trạng thái ẩn. */
  unmountOnExit?: boolean;
  /** Override thời lượng ms — mặc định token `--motion-base` (240ms). */
  duration?: number;
  /** Trễ ms trước khi animation chạy (fill backwards — element ẩn trong lúc trễ). */
  delay?: number;
  /** Timing function — mặc định token `var(--ease-smooth)` (depth contract). */
  easing?: string;
  className?: string;
  children: ReactNode;
}

/** State machine chung: mở → mount; đóng → chờ animation/transition end mới unmount. */
function useExitMachine(show: boolean) {
  const [mounted, setMounted] = useState(show);
  useEffect(() => {
    if (show) setMounted(true);
  }, [show]);
  const closing = mounted && !show;
  // Chỉ nhận end-event từ chính wrapper (con bắn animationEnd bubble lên không tính)
  const handleEnd = (e: AnimationEvent<HTMLDivElement> | TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setMounted(false);
  };
  return { mounted, closing, handleEnd };
}

function baseCls(show: boolean, unmountOnExit: boolean, extra: string, className?: string) {
  // giữ ẩn sau exit khi giữ DOM (animation không fill — cần class hold)
  const hold = !show && !unmountOnExit ? ' opacity-0' : '';
  return `${extra}${hold}${className ? ` ${className}` : ''}`;
}

/** Style animation dùng chung — duration/delay/easing/reverse (exit = reverse enter). */
function animStyle(opts: {
  duration?: number;
  delay?: number;
  easing?: string;
  closing?: boolean;
}): CSSProperties {
  return {
    ...(opts.duration ? { animationDuration: `${opts.duration}ms` } : null),
    ...(opts.delay
      ? { animationDelay: `${opts.delay}ms`, animationFillMode: 'both' as const }
      : null),
    ...(opts.easing ? { animationTimingFunction: opts.easing } : null),
    ...(opts.closing ? { animationDirection: 'reverse' as const } : null),
  };
}

/** Fade — mờ dần/vào mờ dần (bp-fade-in / bp-fade-out). */
export function Fade({ in: show = true, unmountOnExit = true, duration, delay, easing, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={animStyle({ duration, delay, easing, closing })}
      className={baseCls(
        show,
        unmountOnExit,
        show
          ? 'animate-[bp-fade-in_var(--motion-base)_var(--ease-smooth)]'
          : 'animate-[bp-fade-out_var(--motion-fast)_var(--ease-smooth)]',
        className,
      )}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {children}
    </div>
  );
}

/** Zoom — phóng từ 96% (bp-zoom-in / bp-zoom-out). */
export function Zoom({ in: show = true, unmountOnExit = true, duration, delay, easing, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={animStyle({ duration, delay, easing, closing })}
      className={baseCls(
        show,
        unmountOnExit,
        show
          ? 'animate-[bp-zoom-in_var(--motion-base)_var(--ease-smooth)]'
          : 'animate-[bp-zoom-out_var(--motion-fast)_var(--ease-smooth)]',
        className,
      )}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {children}
    </div>
  );
}

/**
 * Collapse — thu/mở theo chiều (grid 0fr↔1fr, KHÔNG keyframe height):
 * padding/border phải đặt trong `children`, KHÔNG trên wrapper — tầng
 * `overflow-hidden` phải clip SẠCH, nếu viền/padding nằm tầng ngoài sẽ giật.
 * `orientation="horizontal"` → thu/mở NGANG (grid-template-columns — sidebar,
 * mở cột chi tiết); children cần bọc nội dung không-wrap nếu muốn giữ độ rộng.
 */
export interface CollapseProps extends TransitionProps {
  /** Chiều thu/mở — vertical (mặc định, FAQ) | horizontal (sidebar/cột). */
  orientation?: 'vertical' | 'horizontal';
}

export function Collapse({ in: show = true, unmountOnExit = true, duration, delay, easing, orientation = 'vertical', className, children }: CollapseProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  const horizontal = orientation === 'horizontal';
  const dim: CSSProperties = horizontal
    ? { gridTemplateColumns: show ? '1fr' : '0fr' }
    : { gridTemplateRows: show ? '1fr' : '0fr' };
  return (
    <div
      style={{
        ...dim,
        transitionTimingFunction: easing ?? 'var(--ease-smooth)',
        ...(duration ? { transitionDuration: `${duration}ms` } : null),
        ...(delay ? { transitionDelay: `${delay}ms` } : null),
      }}
      className={`grid ${horizontal ? 'transition-[grid-template-columns]' : 'transition-[grid-template-rows]'} duration-[var(--motion-base)]${!show && !unmountOnExit ? ' invisible' : ''}${className ? ` ${className}` : ''}`}
      onTransitionEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      <div className={horizontal ? 'h-full min-w-0 overflow-hidden' : 'min-h-0 overflow-hidden'}>{children}</div>
    </div>
  );
}

/** Slide — trôi vào từ 1 cạnh (direction: up mặc định / down / left / right).
 * Exit = reverse của enter. up tái dùng bp-slide-up-in; left/right có sẵn. */
export interface SlideProps extends TransitionProps {
  /** Cạnh element trôi vào từ. */
  direction?: 'up' | 'down' | 'left' | 'right';
}

const SLIDE_CLS: Record<NonNullable<SlideProps['direction']>, string> = {
  up: 'animate-[bp-slide-up-in_var(--motion-base)_var(--ease-smooth)]',
  down: 'animate-[bp-slide-in-down_var(--motion-base)_var(--ease-smooth)]',
  left: 'animate-[bp-slide-in-left_var(--motion-base)_var(--ease-smooth)]',
  right: 'animate-[bp-slide-in-right_var(--motion-base)_var(--ease-smooth)]',
};

export function Slide({ direction = 'up', in: show = true, unmountOnExit = true, duration, delay, easing, className, children }: SlideProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={animStyle({ duration, delay, easing, closing })}
      className={baseCls(show, unmountOnExit, SLIDE_CLS[direction], className)}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {children}
    </div>
  );
}

/** Grow — scale 0.85→1 TỪ GỐC `origin` (CSS transform-origin — 'bottom left' cho
 * menu mọc từ trigger, 'top right' cho popover góc…). Exit = reverse (co về gốc). */
export interface GrowProps extends TransitionProps {
  /** transform-origin — 'bottom left' (mặc định) | 'top right' | bất kỳ giá trị CSS. */
  origin?: string;
}

export function Grow({ origin = 'bottom left', in: show = true, unmountOnExit = true, duration, delay, easing, className, children }: GrowProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={{ transformOrigin: origin, ...animStyle({ duration, delay, easing, closing }) }}
      className={baseCls(show, unmountOnExit, 'animate-[bp-grow-in_var(--motion-base)_var(--ease-smooth)]', className)}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {children}
    </div>
  );
}

/** Flip — xoay 3D quanh trục Y (perspective 800px, rotateY 70°→0). Exit = reverse. */
export function Flip({ in: show = true, unmountOnExit = true, duration, delay, easing, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={animStyle({ duration, delay, easing, closing })}
      className={baseCls(show, unmountOnExit, 'animate-[bp-flip_var(--motion-base)_var(--ease-smooth)]', className)}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {children}
    </div>
  );
}

/** Rotate — quay đơn trục -90°→0 kèm scale nhẹ (flip-clock/settle). Exit = reverse. */
export function Rotate({ in: show = true, unmountOnExit = true, duration, delay, easing, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={animStyle({ duration, delay, easing, closing })}
      className={baseCls(show, unmountOnExit, 'animate-[bp-rotate-in_var(--motion-base)_var(--ease-smooth)]', className)}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {children}
    </div>
  );
}

/** Blur — focus-in từ mờ 8px (ảnh hero, khung ảnh lớn). Ngoại lệ duy nhất animate
 * `filter` (bản chất của loại — vẫn GPU-composited). Exit = reverse. */
export function Blur({ in: show = true, unmountOnExit = true, duration, delay, easing, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={animStyle({ duration, delay, easing, closing })}
      className={baseCls(show, unmountOnExit, 'animate-[bp-blur-in_var(--motion-base)_var(--ease-smooth)]', className)}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {children}
    </div>
  );
}

/** Bounce — pop overshoot (scale .6→1.05→.97→1) — điểm thưởng/success pop.
 * Exit = reverse (co về). */
export function Bounce({ in: show = true, unmountOnExit = true, duration, delay, easing, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={animStyle({ duration, delay, easing, closing })}
      className={baseCls(show, unmountOnExit, 'animate-[bp-bounce-in_var(--motion-base)_var(--ease-smooth)]', className)}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {children}
    </div>
  );
}

/** ScaleSoft — scale 0.98→1 cực nhẹ (khởi hiện vùng nội dung, không gây chú ý). */
export function ScaleSoft({ in: show = true, unmountOnExit = true, duration, delay, easing, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={animStyle({ duration, delay, easing, closing })}
      className={baseCls(show, unmountOnExit, 'animate-[bp-soft-in_var(--motion-base)_var(--ease-smooth)]', className)}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {children}
    </div>
  );
}

/** Stagger — children hiện nối tiếp (delay cộng dồn `staggerMs`/mục, mặc định 30 —
 * depth contract 24-40ms). Mỗi con bọc 1 tầng animate bp-slide-up-in fill both;
 * exit = container fade-out rồi mới unmount (end-event từ chính container). */
export interface StaggerProps extends TransitionProps {
  /** Trễ nối tiếp giữa 2 mục (ms) — mặc định 30 (depth contract 24-40). */
  staggerMs?: number;
}

export function Stagger({ staggerMs = 30, in: show = true, unmountOnExit = true, duration, delay = 0, easing, className, children }: StaggerProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  const items = Array.isArray(children) ? children : [children];
  const ease = easing ?? 'var(--ease-smooth)';
  return (
    <div
      style={animStyle({ duration, easing })}
      className={baseCls(
        show,
        unmountOnExit,
        closing ? 'animate-[bp-fade-out_var(--motion-fast)_var(--ease-smooth)]' : '',
        className,
      )}
      onAnimationEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      {items.map((child, i) => (
        <div key={i} style={{ animation: `bp-slide-up-in ${duration ?? 240}ms ${ease} ${delay + i * staggerMs}ms both` }}>
          {child}
        </div>
      ))}
    </div>
  );
}

/** Crossfade — swap 2 children CÙNG chỗ (grid chồng cell): `active` 0|1, mục
 * không active opacity-0 + pointer-events-none. Không machine (cả 2 luôn mounted —
 * transition-opacity ease-smooth). Container cao theo child CAO HƠN (không nhảy layout). */
export interface CrossfadeProps {
  /** Chỉ mục hiện: 0 | 1. */
  active?: 0 | 1;
  /** Thời lượng crossfade ms — mặc định token `--motion-base` (240ms). */
  duration?: number;
  /** Timing function — mặc định token `var(--ease-smooth)`. */
  easing?: string;
  className?: string;
  /** Đúng 2 node — [mục 0, mục 1]. */
  children: ReactNode;
}

export function Crossfade({ active = 0, duration, easing, className, children }: CrossfadeProps) {
  const items = (Array.isArray(children) ? children : [children]).slice(0, 2);
  return (
    <div className={`relative grid${className ? ` ${className}` : ''}`}>
      {items.map((child, i) => (
        <div
          key={i}
          aria-hidden={active !== i || undefined}
          style={{
            ...(duration ? { transitionDuration: `${duration}ms` } : null),
            ...(easing ? { transitionTimingFunction: easing } : null),
          }}
          className={`col-start-1 row-start-1 transition-opacity ${active === i ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
