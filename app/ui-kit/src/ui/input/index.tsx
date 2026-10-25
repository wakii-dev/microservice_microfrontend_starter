// Input + Textarea — antd look (decision 2026-10-17): h-8, border line, focus ring
// accent, invalid viền đỏ. Completeness audit (Tier 1.5): size + prefix/suffix
// (affix pattern antd — wrapper mang viền, input trần bên trong) + allowClear
// (controlled: cần value + onChange) + passthrough native props.
// Depth contract 2026-10-19 (direction-approved.md): rest bg-s3 lún + ele-1,
// focus bg-s1 nổi + ring 3px accent/40 + ele-2 — elevation đổi CÓ animate
// (ease-smooth 200ms); press/disabled hạ bóng.
// Customize pass (SÓNG-3): Input thêm classNames slots (root/input/prefix/suffix),
// Textarea slots (root/textarea/count) + style passthrough — default path (không
// truyền) giữ nguyên DOM/GUI.
import type { ChangeEvent, CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Icon } from '../icons/index.js';
import { SearchInput } from './input-search';

const SMOOTH = 'transition-[background-color,border-color,box-shadow,color] duration-200 ease-[var(--ease-smooth)]';
const FIELD_BASE =
  `w-full rounded-lg border bg-s3 text-body text-ink placeholder:text-ink4 shadow-[var(--ele-1)] ${SMOOTH} focus:outline-none focus:bg-s1 focus:shadow-[var(--ele-2)] disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink4 disabled:shadow-none`;
const FIELD_OK = 'border-line focus:border-accent-hi';
const FIELD_INVALID = 'border-st-fail focus:border-st-fail';
const RING_OK = 'focus:ring-[3px] focus:ring-accent/40';
const RING_INVALID = 'focus:ring-[3px] focus:ring-st-fail/40';

const SIZE_CLS = {
  small: 'h-6 px-2 text-label',
  middle: 'h-8 px-3 text-body',
  large: 'h-10 px-3 text-body',
} as const;

export type InputSize = keyof typeof SIZE_CLS;

/** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định (consumer append). */
export interface InputClassNames {
  /** Element mang viền/ring — <input> khi không affix, <span> wrapper khi affix. */
  root?: string;
  /** Element <input> thật — standalone: cùng element với root; affix: input trần bên trong. */
  input?: string;
  /** Span bọc prefix — chỉ render khi có prefix. */
  prefix?: string;
  /** Span bọc suffix — chỉ render khi có suffix. */
  suffix?: string;
}

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
  /** Inline style — passthrough lên element gốc (input / affix wrapper). */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: InputClassNames;
}

// slot helper — ghép class consumer vào sau mặc định (undefined → rỗng)
const slot = (c?: string) => (c ? ` ${c}` : '');

function InputBase({
  invalid = false,
  size = 'middle',
  prefix,
  suffix,
  allowClear = false,
  className,
  style,
  classNames,
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
        className={`${FIELD_BASE} ${SIZE_CLS[size]} ${ringCls}${slot(classNames?.root)}${slot(classNames?.input)}${className ? ` ${className}` : ''}`}
        {...rest}
        style={style}
      />
    );
  }

  // Affix pattern antd: wrapper mang viền/ring, input trần flex-1 bên trong.
  // Ring/focus đổi focus: → focus-within: (span không focusable — ring affix
  // giờ ăn thật khi input bên trong focus; depth contract: focus = nổi s1).
  const ringWrapper = ringCls.replaceAll('focus:', 'focus-within:');
  return (
    <span
      className={`inline-flex w-full items-center gap-1 rounded-lg border bg-s3 px-2 shadow-[var(--ele-1)] ${SMOOTH} focus-within:bg-s1 focus-within:shadow-[var(--ele-2)] focus-within:outline-none ${ringWrapper}${slot(classNames?.root)}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {prefix && <span className={`shrink-0 text-ink3${slot(classNames?.prefix)}`}>{prefix}</span>}
      <input
        value={value}
        onChange={onChange}
        className={`min-w-0 flex-1 border-none bg-transparent outline-none ${SIZE_CLS[size]} text-ink placeholder:text-ink4${slot(classNames?.input)}`}
        {...rest}
      />
      {showClear && (
        <button
          type="button"
          aria-label="Xoá"
          className={`cursor-pointer border-none bg-transparent text-ink3 hover:text-ink2 ${SMOOTH}`}
          onClick={() => onChange?.({ target: { value: '' } } as unknown as ChangeEvent<HTMLInputElement>)}
        >
          <Icon name="times" size={12} />
        </button>
      )}
      {suffix && <span className={`shrink-0 text-ink3${slot(classNames?.suffix)}`}>{suffix}</span>}
    </span>
  );
}

/** Input composite antd — `Input.Search` (input + nút search: onSearch/enterButton/loading — xem `input-search.tsx`). */
// eslint-disable-next-line react-refresh/only-export-components
export const Input = Object.assign(InputBase, { Search: SearchInput });

/** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định (consumer append). */
export interface TextareaClassNames {
  /** Div wrapper bên ngoài (bọc cả textarea lẫn count). */
  root?: string;
  /** Element <textarea>. */
  textarea?: string;
  /** Dòng đếm ký tự — chỉ render khi showCount + maxLength. */
  count?: string;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** Hiện đếm ký tự (cần maxLength) — antd showCount. */
  showCount?: boolean;
  className?: string;
  /** Inline style — passthrough thẳng lên <textarea>. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: TextareaClassNames;
}

export function Textarea({
  invalid = false,
  showCount = false,
  className,
  style,
  classNames,
  value,
  maxLength,
  ...rest
}: TextareaProps) {
  const count = showCount && maxLength ? String(value ?? '').length : null;
  const ringCls = invalid ? RING_INVALID : RING_OK;
  return (
    <div className={`w-full${slot(classNames?.root)}`}>
      <textarea
        value={value}
        maxLength={maxLength}
        className={`${FIELD_BASE} py-2 ${invalid ? FIELD_INVALID : FIELD_OK} ${ringCls}${slot(classNames?.textarea)}${className ? ` ${className}` : ''}`}
        {...rest}
        style={style}
      />
      {count !== null && (
        <div className={`mt-1 text-right text-meta text-ink3 tabular-nums${slot(classNames?.count)}`}>
          {count}/{maxLength}
        </div>
      )}
    </div>
  );
}
