// ToggleButton — button với checked state (antd-lite).
// Customize pass (slots wave 3): classNames slot root + style passthrough —
// default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface ToggleButtonClassNames {
  /** <button> toggle (aria-pressed). */
  root?: string;
}

export interface ToggleButtonProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Giá trị đại diện khi nằm trong `ToggleButtonGroup` (đứng lẻ: bỏ qua). */
  value?: string;
  children: ReactNode;
  className?: string;
  /** Inline style — passthrough lên button. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: ToggleButtonClassNames;
}

export function ToggleButton(props: ToggleButtonProps) {
  const { checked = false, onChange, disabled, children, className, style } = props;
  const slots = props.classNames;
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={classNames(
        'inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border px-3 text-body transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none',
        checked ? 'border-accent bg-accent text-white' : 'border-line bg-s2 text-ink hover:border-accent hover:text-accent',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        slots?.root,
        className,
      )}
      style={style}
    >
      {children}
    </button>
  );
}
