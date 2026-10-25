// Switch — antd 44×22 (small 36×16) nâng cấp iOS/MUI-grade (batch ⑳ 2026-10-18):
// checked = gradient accent→accent-hi + inner shadow; unchecked = bg-ink/25
// (dark-safe — hết rgba đen cứng); handle trắng shadow 2 lớp, spring translate
// + pop scale .9→1 lúc toggle (keyframe bp-switch-pop INJECT module-load — scope
// src/ui/switch/* không đụng tailwind.css; prefers-reduced-motion tự tắt nhờ
// block global trong tailwind.css); children cross-fade 150ms; focus ring đồng
// bộ Button (ring-accent/40 offset-2); disabled phẳng (không shadow handle).
// Customize pass (SÓNG-3): classNames slots (root/handle) + style passthrough —
// default path (không truyền) giữ nguyên DOM/GUI.
// Customize pass (slots wave 3): ghép slot qua package classnames (bỏ slot helper).
import classNames from 'classnames';
import { useState, type CSSProperties, type ReactNode } from 'react';

if (typeof document !== 'undefined' && !document.querySelector('style[data-bp-switch-pop]')) {
  const style = document.createElement('style');
  style.setAttribute('data-bp-switch-pop', '');
  style.textContent = '@keyframes bp-switch-pop{from{transform:scale(.9)}to{transform:scale(1)}}';
  document.head.appendChild(style);
}

/** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định (consumer append). */
export interface SwitchClassNames {
  /** <button> track (role=switch) — cùng element với className prop. */
  root?: string;
  /** Span handle trắng (knob) trượt theo checked. */
  handle?: string;
}

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'default' | 'small';
  /** Nhãn trong switch (checked) — antd checkedChildren/unCheckedChildren. */
  checkedChildren?: ReactNode;
  unCheckedChildren?: ReactNode;
  'aria-label'?: string;
  className?: string;
  /** Inline style — passthrough thẳng lên <button> track. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: SwitchClassNames;
}

export function Switch(props: SwitchProps) {
  const {
    checked = false,
    onChange,
    disabled = false,
    size = 'default',
    checkedChildren,
    unCheckedChildren,
    className,
    style,
    ...rest
  } = props;
  const slots = props.classNames;
  const [popping, setPopping] = useState(false);

  const track = size === 'small' ? 'h-5 w-9' : 'h-6 w-11';
  const knob = size === 'small' ? 'size-3.5' : 'size-[18px]';
  const translate = checked
    ? size === 'small'
      ? 'translate-x-[14px]'
      : 'translate-x-[22px]'
    : 'translate-x-[2px]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        onChange?.(!checked);
        setPopping(true);
      }}
      {...rest}
      style={style}
      className={classNames(
        'group relative inline-flex shrink-0 items-center overflow-hidden rounded-pill border-none outline-none transition-colors duration-200 ease-[var(--ease-smooth)] focus-visible:ring-2 focus-visible:ring-accent/40',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        track,
        checked ? '' : 'bg-ink/25',
        slots?.root,
        className,
      )}
    >
      {/* Gradient layer — opacity transition cho màu mượt (gradient không transition được trực tiếp) */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-pill bg-gradient-to-r from-accent to-accent-hi shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] transition-opacity duration-200 ease-[var(--ease-smooth)] ${
          checked ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span
        onAnimationEnd={() => setPopping(false)}
        className={classNames(
          'absolute left-0 z-10 grid place-items-center rounded-pill bg-white text-[10px] text-ink2 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-105',
          knob,
          translate,
          disabled ? '' : 'shadow-[0_2px_4px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.08)]',
          popping ? 'animate-[bp-switch-pop_200ms_var(--ease-enter)]' : '',
          slots?.handle,
        )}
      >
        {/* Cross-fade + slide nhẹ 150ms khi đổi state (remount theo key) */}
        <span
          key={checked ? 'on' : 'off'}
          className={`inline-flex items-center animate-[bp-slide-up-in_150ms_var(--ease-enter)]`}
        >
          {checked ? checkedChildren : unCheckedChildren}
        </span>
      </span>
    </button>
  );
}
