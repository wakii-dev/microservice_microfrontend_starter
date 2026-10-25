// Radio + Radio.Group — tròn 16px, checked = dot accent; Group options layout
// horizontal mặc định (antd RadioGroup).
// A11y (sweep 2026-10-18): Group bắn chung `name` (useId) cho input radio →
// ←↑/→↑ di chuyển giữa options như native (roving selection); group nhận
// aria-label passthrough (role=radiogroup cần accessible name).
// Customize pass (SÓNG-3): Radio slots (root/box/label) + Group slot (root) +
// style passthrough — default path (không truyền) giữ nguyên DOM/GUI.
// Customize pass (slots wave 3): ghép slot qua package classnames (bỏ slot helper).
import classNames from 'classnames';
import { useId, type CSSProperties, type ReactNode } from 'react';

/** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định (consumer append). */
export interface RadioClassNames {
  /** <label> bọc ngoài — cùng element với className prop. */
  root?: string;
  /** Element <input type=radio> (chấm tròn). */
  box?: string;
  /** Span bọc label text (children) — chỉ render khi truyền (không truyền → text trần như cũ). */
  label?: string;
}

export interface RadioProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** name chung của group — Group tự sinh; truyền tay chỉ dùng khi Radio đơn lẻ. */
  name?: string;
  children?: ReactNode;
  className?: string;
  /** Inline style — passthrough lên <label>. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: RadioClassNames;
}

export function Radio(props: RadioProps) {
  const { checked = false, onChange, disabled = false, name, children, className, style } = props;
  const slots = props.classNames;
  return (
    <label
      className={classNames(
        'inline-flex cursor-pointer items-center gap-2 text-body text-ink',
        disabled ? 'cursor-not-allowed text-ink3' : '',
        slots?.root,
        className,
      )}
      style={style}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className={classNames(
          'peer size-4 cursor-pointer appearance-none rounded-pill border border-line bg-s2 shadow-[var(--ele-1)] transition-[border-color,border-width,box-shadow,transform] duration-200 ease-[var(--ease-smooth)] hover:border-ink/20 checked:border-[5px] checked:border-accent checked:scale-[1.1] checked:shadow-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-s3 disabled:shadow-none',
          slots?.box,
        )}
      />
      {slots?.label ? <span className={slots.label}>{children}</span> : children}
    </label>
  );
}

/** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định (consumer append). */
export interface RadioGroupClassNames {
  /** Div role=radiogroup — cùng element với className prop. */
  root?: string;
}

export interface RadioGroupProps {
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ label: ReactNode; value: string; disabled?: boolean }>;
  disabled?: boolean;
  /** Accessible name cho role="radiogroup". */
  'aria-label'?: string;
  className?: string;
  /** Inline style — passthrough lên div radiogroup. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: RadioGroupClassNames;
}

export function RadioGroup(props: RadioGroupProps) {
  const { value, onChange, options, disabled = false, className, style, ...rest } = props;
  const slots = props.classNames;
  // Tên chung cho cả nhóm input — bật điều hướng arrow-key native giữa options.
  const name = useId();
  return (
    <div
      role="radiogroup"
      className={classNames('flex flex-wrap items-center gap-4', slots?.root, className)}
      style={style}
      {...rest}
    >
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          checked={value === option.value}
          disabled={disabled || option.disabled}
          onChange={(checked) => checked && onChange?.(option.value)}
        >
          {option.label}
        </Radio>
      ))}
    </div>
  );
}
