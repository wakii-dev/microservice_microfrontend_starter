// Input.Search — antd parity (docs/parity-matrix.md Gap P0): input + nút search
// dính bên phải trong cùng field. API antd: `onSearch(text)` (Enter hoặc click),
// `enterButton` (true → nút primary icon; ReactNode → nút default kèm nội dung),
// `loading` (Spinner thay icon + chặn search tiếp — không stack request).
// Style cùng họ Input (h-6/8/10, border line, focus ring accent, invalid đỏ) —
// wrapper mang viền + focus-within, input trần bên trong (pattern affix antd).
import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../icons/index';
import { Spinner } from '../spinner/index';

export interface InputSearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
  /** Gọi khi search (Enter hoặc click nút) — tham số là giá trị input hiện tại. */
  onSearch?: (value: string) => void;
  /** true → nút primary icon search; ReactNode → nút default với nội dung đó; bỏ → icon ghost. */
  enterButton?: boolean | ReactNode;
  /** Đang loading — Spinner thay icon + chặn Enter/click phát thêm (antd loading). */
  loading?: boolean;
  /** Error state — viền + ring đỏ như Input `invalid`. */
  invalid?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
}

const SIZE_CLS = { small: 'h-6 text-label', middle: 'h-8 text-body', large: 'h-10 text-body' } as const;
const RING_OK = 'focus-within:border-accent-hi focus-within:ring-2 focus-within:ring-accent/10';
const RING_INVALID = 'focus-within:border-st-fail focus-within:ring-2 focus-within:ring-st-fail/10';

export function SearchInput({
  onSearch,
  enterButton = false,
  loading = false,
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
  const controlled = value !== undefined;
  const text = String((controlled ? value : inner) ?? '');

  function fire() {
    if (loading || disabled) return;
    onSearch?.(text);
  }

  const buttonCls = enterButton
    ? 'bg-accent text-white hover:bg-accent-hi'
    : 'border-l border-line bg-transparent text-ink3 hover:bg-s3 hover:text-accent';

  return (
    <span
      className={`inline-flex w-full items-stretch overflow-hidden rounded-lg border bg-s2 transition-colors focus-within:outline-none ${SIZE_CLS[size]} ${invalid ? RING_INVALID : RING_OK}${disabled ? ' cursor-not-allowed bg-ink/5' : ''}${className ? ` ${className}` : ''}`}
    >
      <input
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
      <button
        type="button"
        // icon-only (default + enterButton=true) cần name; ReactNode tự có text content
        aria-label={enterButton === true || !enterButton ? 'Search' : undefined}
        disabled={disabled}
        onClick={fire}
        className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 border-none px-3 text-label font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[var(--bg-disabled)] disabled:text-ink4 ${buttonCls}${loading ? ' cursor-wait' : ''}`}
      >
        {loading ? (
          <Spinner size="small" label="" aria-hidden="true" />
        ) : enterButton === true || !enterButton ? (
          <Icon name="search" size={14} />
        ) : (
          enterButton
        )}
      </button>
    </span>
  );
}
