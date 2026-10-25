// Input.Search — antd parity (docs/parity-matrix.md Gap P0): input + nút search
// dính bên phải trong cùng field. API antd: `onSearch(text)` (Enter hoặc click),
// `enterButton` (true → nút primary icon; ReactNode → nút default kèm nội dung),
// `loading` (Spinner thay icon + chặn search tiếp — không stack request).
// Style cùng họ Input (h-6/8/10, border line, focus ring accent, invalid đỏ) —
// wrapper mang viền + focus-within, input trần bên trong (pattern affix antd).
import { useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../icons/index';
import { Spinner } from '../spinner/index';

export interface InputSearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
  /** Gọi khi search (Enter hoặc click nút) — tham số là giá trị input hiện tại. */
  onSearch?: (value: string) => void;
  /** true → nút primary icon search; ReactNode → nút default với nội dung đó; bỏ → icon ghost. */
  enterButton?: boolean | ReactNode;
  /** Đang loading — Spinner thay icon + chặn Enter/click phát thêm (antd loading). */
  loading?: boolean;
  /** Nút × xoá giá trị — hiện khi có text; xoá KHÔNG phát onSearch (chỉ onChange). */
  allowClear?: boolean;
  /** Error state — viền + ring đỏ như Input `invalid`. */
  invalid?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
}

const SIZE_CLS = { small: 'h-6 text-label', middle: 'h-8 text-body', large: 'h-10 text-body' } as const;
// Depth contract: rest bg-s3 lún + ele-1 → focus bg-s1 + ring 3px accent/40 + ele-2,
// mọi transition ease-smooth (direction-approved.md 2026-10-19).
const SMOOTH = 'transition-[background-color,border-color,box-shadow,color,transform] duration-200 ease-[var(--ease-smooth)]';
const RING_OK = 'focus-within:border-accent-hi focus-within:ring-[3px] focus-within:ring-accent/40';
const RING_INVALID = 'focus-within:border-st-fail focus-within:ring-[3px] focus-within:ring-st-fail/40';

export function SearchInput({
  onSearch,
  enterButton = false,
  loading = false,
  allowClear = false,
  invalid = false,
  size = 'middle',
  className,
  value,
  onChange,
  onKeyDown,
  disabled = false,
  ...rest
}: InputSearchProps) {
  const [inner, setInner] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const controlled = value !== undefined;
  const text = String((controlled ? value : inner) ?? '');

  function clearValue() {
    if (disabled) return;
    if (!controlled) setInner('');
    onChange?.({ target: { value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>);
    inputRef.current?.focus();
  }

  function fire() {
    if (loading || disabled) return;
    onSearch?.(text);
  }

  const buttonCls = enterButton
    ? 'bg-accent text-white hover:bg-accent-hi'
    : 'border-l border-line bg-transparent text-ink3 hover:bg-s3 hover:text-accent';

  return (
    <span
      className={`inline-flex w-full items-stretch overflow-hidden rounded-lg border bg-s3 shadow-[var(--ele-1)] ${SMOOTH} focus-within:bg-s1 focus-within:shadow-[var(--ele-2)] focus-within:outline-none ${SIZE_CLS[size]} ${invalid ? RING_INVALID : RING_OK}${disabled ? ' cursor-not-allowed bg-ink/5 shadow-none' : ''}${className ? ` ${className}` : ''}`}
    >
      <input
        ref={inputRef}
        value={controlled ? value : inner}
        onChange={(e) => {
          if (!controlled) setInner(e.target.value);
          onChange?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.key === 'Enter') fire();
        }}
        disabled={disabled}
        className={`min-w-0 flex-1 border-none bg-transparent pl-3 outline-none ${SIZE_CLS[size]} text-ink placeholder:text-ink4 disabled:cursor-not-allowed disabled:text-ink4`}
        {...rest}
      />
      {allowClear && text !== '' && !disabled && (
        <button
          type="button"
          aria-label="Xoá nội dung tìm kiếm"
          onClick={clearValue}
          className={`shrink-0 cursor-pointer border-none bg-transparent pr-0.5 text-ink3 hover:text-ink2 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${SMOOTH}`}
        >
          <Icon name="times" size={12} />
        </button>
      )}
      <button
        type="button"
        // icon-only (default + enterButton=true) cần name; ReactNode tự có text content
        aria-label={enterButton === true || !enterButton ? 'Search' : undefined}
        disabled={disabled}
        onClick={fire}
        className={`group/search inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 border-none px-3 text-label font-medium focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[var(--bg-disabled)] disabled:text-ink4 ${SMOOTH} active:translate-y-px ${buttonCls}${loading ? ' cursor-wait' : ''}`}
      >
        {loading ? (
          <Spinner size="small" label="" aria-hidden="true" />
        ) : enterButton === true || !enterButton ? (
          /* Icon slide 2px hover (depth contract — icon slide trong button hover) */
          <Icon name="search" size={14} className="transition-transform duration-200 ease-[var(--ease-smooth)] group-hover/search:translate-x-[2px]" />
        ) : (
          enterButton
        )}
      </button>
    </span>
  );
}
