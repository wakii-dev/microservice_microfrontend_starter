// Button — antd look, modernize pass (vision-audit 2026-10-18: phẳng/thấp/radius nhỏ,
// secondary mất định nghĩa trên nền trắng): mặc định h-9 (36px antd middle), rounded-lg
// 8px, font-medium + tracking nhẹ, default variant bg-s2 + border-line rõ (hover bg-s3),
// primary hover accent-hi, focus ring accent/40 + offset canvas, active scale 0.98,
// loading → Spinner 3.5 inline + cursor-wait. Disabled dùng token --bg-disabled (dark-safe).
// API GIỮ NGUYÊN (type/danger/icon/htmlType/block/disabled) — chỉ thêm/nâng visual,
// không break consumers (không ai trong repo truyền size=). Customize pass (SÓNG-3):
// thêm classNames slots (root/icon) + style passthrough — default path (không truyền)
// giữ nguyên DOM/GUI.
// Map từ style cũ của repo: .tsk-btn--primary → type=primary · .tsk-btn/.sh-btn →
// type=default · .tsk-btn--ghost/.sh-btn--ghost → type=text · .tsk-btn--danger →
// type=primary+danger · .tsk-btn--danger-ghost → type=text+danger.
// API theo antd: `type` = variant, `htmlType` = HTML button type.
// Customize pass (slots wave 3): ghép slot qua package classnames (bỏ slot helper).
import classNames from 'classnames';
import { useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Spinner } from '../spinner/index';

/** Ripple click — span overlay scale từ điểm chạm (bp-ripple, motion identity). */
interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export type ButtonType = 'primary' | 'default' | 'text';
export type ButtonSize = 'small' | 'middle' | 'large';

/** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định (consumer append). */
export interface ButtonClassNames {
  /** Phần tử <button> gốc — chèn sau structural classes, trước className prop. */
  root?: string;
  /** Span bọc icon — chỉ render khi truyền (không truyền → icon render trần như cũ). */
  icon?: string;
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Variant visual — antd Button type. */
  type?: ButtonType;
  /** HTML button type (antd htmlType) — mặc định 'button' an toàn trong form. */
  htmlType?: 'button' | 'submit' | 'reset';
  /** Đỏ (nguy hiểm) — với type=primary nền đặc, type=text chữ đỏ, type=default rơi về variant default. */
  danger?: boolean;
  /** antd size: small (h-8) / middle (h-9, mặc định) / large (h-10). */
  size?: ButtonSize;
  /** Loading — Spinner 3.5 inline thay icon + disable + cursor-wait (antd loading). */
  loading?: boolean;
  /** Full-width (antd block). */
  block?: boolean;
  /** Icon trước nhãn (antd icon) — ẩn khi loading (Spinner thay). */
  icon?: ReactNode;
  children?: ReactNode;
  /** Append sau structural classes (pattern antd). */
  className?: string;
  /** Inline style — passthrough thẳng lên <button>. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: ButtonClassNames;
}

const BASE =
  'inline-flex items-center justify-center gap-1 rounded-lg border font-medium tracking-[0.01em] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-line disabled:bg-[var(--bg-disabled)] disabled:text-ink4 active:scale-[0.98] hover:-translate-y-px hover:shadow-[var(--shadow-lift)]';

const SIZE: Record<ButtonSize, string> = {
  small: 'h-8 px-3 text-label',
  middle: 'h-9 px-4 text-body',
  large: 'h-10 px-5 text-body',
} as const;

const VARIANTS: Record<ButtonType, string> = {
  'primary': 'border-accent bg-accent text-white hover:border-accent-hi hover:bg-accent-hi',
  'default': 'border-line bg-s2 text-ink hover:bg-s3',
  'text': 'border-transparent bg-transparent text-ink hover:bg-s3',
};

const DANGER: Partial<Record<ButtonType, string>> = {
  'primary': 'border-st-fail bg-st-fail text-white hover:border-st-fail/85 hover:bg-st-fail/85',
  'text': 'border-transparent bg-transparent text-st-fail hover:bg-st-fail/12',
};

export function Button(props: ButtonProps) {
  const {
    type = 'default',
    htmlType = 'button',
    danger = false,
    size = 'middle',
    loading = false,
    block = false,
    icon,
    className,
    style,
    children,
    disabled,
    onPointerDown,
    ...rest
  } = props;
  const slots = props.classNames;
  const variant = danger ? (DANGER[type] ?? VARIANTS[type]) : VARIANTS[type];
  // icon chỉ bọc span khi consumer truyền classNames.icon — default path giữ DOM y hệt
  const iconSlot = slots?.icon;

  // Ripple click (motion waves): spawn span tại điểm chạm, animationend tự prune.
  // Reduced-motion: animation rơi 0.01ms → span invisible ngay + end-event vẫn fire.
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const seq = useRef(0);

  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    onPointerDown?.(e);
    if (disabled || loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const id = seq.current++;
    setRipples((prev) => [
      ...prev.slice(-3), // cap 4 ripple — spam click không tích tụ
      { x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size, id },
    ]);
  }

  function pruneRipple(id: number) {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }
  // cursor tách khỏi BASE — loading cần cursor-wait đè cursor-pointer (cùng specificity,
  // đặt điều kiện thay vì append sau để không phụ thuộc thứ tự CSS utilities).
  return (
    <button
      type={htmlType}
      disabled={disabled || loading}
      onPointerDown={handlePointerDown}
      className={classNames(
        BASE,
        'relative overflow-hidden',
        loading ? 'cursor-wait' : 'cursor-pointer',
        SIZE[size],
        variant,
        block ? 'w-full' : '',
        slots?.root,
        className,
      )}
      {...rest}
      style={style}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          onAnimationEnd={() => pruneRipple(r.id)}
          className={`pointer-events-none absolute rounded-pill animate-[bp-ripple_500ms_var(--ease-exit)] ${
            type === 'primary' || danger ? 'bg-white/30' : 'bg-accent/20'
          }`}
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
      {loading && <Spinner size="default" label="" className="-ml-1" aria-hidden="true" />}
      {!loading && (iconSlot ? <span className={iconSlot}>{icon}</span> : icon)}
      {children}
    </button>
  );
}
