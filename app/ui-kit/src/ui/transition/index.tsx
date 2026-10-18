// Transition — 3 wrapper enter/exit kiểu MUI (motion-effects W8, 0 deps):
// `Fade` opacity · `Zoom` scale 0.96→1 · `Collapse` height 0fr↔1fr (3 tầng
// grid > min-h-0 overflow-hidden > children — padding nằm SẶC trong tầng clip,
// đừng tái phạm bug padding-leak Collapse). Keyframe/token có sẵn (bp-fade-in/
// out, bp-zoom-in/out, --motion-base) — duration override qua inline style để
// class giữ LITERAL (Tailwind quét được). unmountOnExit (mặc định): exit chạy
// XONG mới unmount (state machine kiểu Modal); false → giữ DOM, ẩn bằng
// opacity-0/0fr. prefers-reduced-motion tự tắt nhờ block global (end-event vẫn
// fire tức thì nên machine vẫn đúng).
import { useEffect, useState, type AnimationEvent, type ReactNode, type TransitionEvent } from 'react';

export interface TransitionProps {
  /** Hiện (enter) / ẩn (exit) — bỏ qua mặc định là hiện. */
  in?: boolean;
  /** Exit xong unmount khỏi DOM (mặc định true); false → giữ DOM ở trạng thái ẩn. */
  unmountOnExit?: boolean;
  /** Override thời lượng ms — mặc định token `--motion-base` (240ms). */
  duration?: number;
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

/** Fade — mờ dần/vào mờ dần (bp-fade-in / bp-fade-out). */
export function Fade({ in: show = true, unmountOnExit = true, duration, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={duration ? { animationDuration: `${duration}ms` } : undefined}
      className={baseCls(
        show,
        unmountOnExit,
        show
          ? 'animate-[bp-fade-in_var(--motion-base)_var(--ease-enter)]'
          : 'animate-[bp-fade-out_var(--motion-fast)_var(--ease-exit)]',
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
export function Zoom({ in: show = true, unmountOnExit = true, duration, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={duration ? { animationDuration: `${duration}ms` } : undefined}
      className={baseCls(
        show,
        unmountOnExit,
        show
          ? 'animate-[bp-zoom-in_var(--motion-base)_var(--ease-enter)]'
          : 'animate-[bp-zoom-out_var(--motion-fast)_var(--ease-exit)]',
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
 * Collapse — thu/mở theo chiều (grid-rows 0fr↔1fr, KHÔNG keyframe height):
 * padding/border phải đặt trong `children`, KHÔNG trên wrapper — tầng
 * `overflow-hidden` phải clip SẠCH, nếu viền/padding nằm tầng ngoài sẽ giật.
 */
export function Collapse({ in: show = true, unmountOnExit = true, duration, className, children }: TransitionProps) {
  const { mounted, closing, handleEnd } = useExitMachine(show);
  if (!mounted) return null;
  return (
    <div
      style={{
        gridTemplateRows: show ? '1fr' : '0fr',
        transitionTimingFunction: show ? 'var(--ease-enter)' : 'var(--ease-exit)',
        ...(duration ? { transitionDuration: `${duration}ms` } : null),
      }}
      className={`grid transition-[grid-template-rows] duration-[var(--motion-base)]${!show && !unmountOnExit ? ' invisible' : ''}${className ? ` ${className}` : ''}`}
      onTransitionEnd={(e) => {
        if (closing) handleEnd(e);
      }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
