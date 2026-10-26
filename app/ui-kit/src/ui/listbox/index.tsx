// Listbox — inline list (không dropdown — Select không popup).
// slots-wave: classNames root/option + style passthrough — default giữ nguyên DOM.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

export interface ListboxOption { label: ReactNode; value: string; disabled?: boolean }

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface ListboxClassNames {
  /** <ul role="listbox"> gốc. */
  root?: string;
  /** <li role="option"> mỗi tuỳ chọn (áp cả selected/disabled). */
  option?: string;
}

export interface ListboxProps {
  options: ListboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  /** Inline style — passthrough lên ul gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: ListboxClassNames;
}

export function Listbox(props: ListboxProps) {
  const { options, value, onChange, className, style } = props;
  const slots = props.classNames;
  return (
    <ul
      role="listbox"
      aria-label="Danh sách lựa chọn"
      className={classNames(
        'm-0 list-none overflow-hidden rounded-xl border border-line bg-s2 [background-image:var(--wash)] shadow-[var(--ele-1)] p-1',
        slots?.root,
        className,
      )}
      style={style}
    >
      {options.map((option) => (
        <li key={option.value} role="option" aria-selected={value === option.value}
          onClick={() => !option.disabled && onChange?.(option.value)}
          className={classNames(
            'flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-body transition-colors',
            value === option.value ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-s3',
            option.disabled && 'cursor-not-allowed text-ink3',
            slots?.option,
          )}>
          {option.label}
        </li>
      ))}
    </ul>
  );
}
