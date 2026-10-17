// Input + Textarea — antd look (decision 2026-10-17): h-8, border line, focus ring
// accent, invalid viền đỏ. Completeness audit (Tier 1.5): size + prefix/suffix
// (affix pattern antd — wrapper mang viền, input trần bên trong) + allowClear
// (controlled: cần value + onChange) + passthrough native props.
import type { ChangeEvent, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

const FIELD_BASE =
  'w-full rounded-2 border bg-s2 text-body text-ink placeholder:text-ink4 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-[rgba(0,0,0,0.04)] disabled:text-ink4';
const FIELD_OK = 'border-line focus:border-accent-hi';
const FIELD_INVALID = 'border-st-fail focus:border-st-fail';
const RING_OK = 'focus:ring-2 focus:ring-accent/10';
const RING_INVALID = 'focus:ring-2 focus:ring-st-fail/10';

const SIZE_CLS = {
  small: 'h-6 px-2 text-label',
  middle: 'h-8 px-3 text-body',
  large: 'h-10 px-3 text-body',
} as const;

export type InputSize = keyof typeof SIZE_CLS;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
  /** Error state — viền + ring đỏ (antd status="error"). */
  invalid?: boolean;
  size?: InputSize;
  /** Node trước input (antd prefix) — kích hoạt affix wrapper. */
  prefix?: ReactNode;
  /** Node sau input (antd suffix) — kích hoạt affix wrapper. */
  suffix?: ReactNode;
  /** Nút × xoá giá trị — controlled (value + onChange) mới hiển thị. */
  allowClear?: boolean;
  className?: string;
}

export function Input({
  invalid = false,
  size = 'middle',
  prefix,
  suffix,
  allowClear = false,
  className,
  value,
  onChange,
  ...rest
}: InputProps) {
  const ringCls = invalid ? `${FIELD_INVALID} ${RING_INVALID}` : `${FIELD_OK} ${RING_OK}`;
  const showClear = allowClear && value !== undefined && value !== null && String(value) !== '';
  const hasAffix = prefix !== undefined || suffix !== undefined || allowClear;

  if (!hasAffix) {
    return (
      <input
        value={value}
        onChange={onChange}
        className={`${FIELD_BASE} ${SIZE_CLS[size]} ${ringCls}${className ? ` ${className}` : ''}`}
        {...rest}
      />
    );
  }

  // Affix pattern antd: wrapper mang viền/ring, input trần flex-1 bên trong
  return (
    <span
      className={`inline-flex w-full items-center gap-1 rounded-2 border bg-s2 px-2 transition-colors focus-within:outline-none ${ringCls}${className ? ` ${className}` : ''}`}
    >
      {prefix && <span className="shrink-0 text-ink3">{prefix}</span>}
      <input
        value={value}
        onChange={onChange}
        className={`min-w-0 flex-1 border-none bg-transparent outline-none ${SIZE_CLS[size]} text-ink placeholder:text-ink4`}
        {...rest}
      />
      {showClear && (
        <button
          type="button"
          aria-label="Xoá"
          className="cursor-pointer border-none bg-transparent text-ink3 transition-colors hover:text-ink2"
          onClick={() => onChange?.({ target: { value: '' } } as unknown as ChangeEvent<HTMLInputElement>)}
        >
          ×
        </button>
      )}
      {suffix && <span className="shrink-0 text-ink3">{suffix}</span>}
    </span>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** Hiện đếm ký tự (cần maxLength) — antd showCount. */
  showCount?: boolean;
  className?: string;
}

export function Textarea({
  invalid = false,
  showCount = false,
  className,
  value,
  maxLength,
  ...rest
}: TextareaProps) {
  const count = showCount && maxLength ? String(value ?? '').length : null;
  const ringCls = invalid ? RING_INVALID : RING_OK;
  return (
    <div className="w-full">
      <textarea
        value={value}
        maxLength={maxLength}
        className={`${FIELD_BASE} py-2 ${invalid ? FIELD_INVALID : FIELD_OK} ${ringCls}${className ? ` ${className}` : ''}`}
        {...rest}
      />
      {count !== null && (
        <div className="mt-1 text-right text-meta text-ink3">
          {count}/{maxLength}
        </div>
      )}
    </div>
  );
}
