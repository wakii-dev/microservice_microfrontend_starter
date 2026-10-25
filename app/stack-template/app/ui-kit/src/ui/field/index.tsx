// Field — wrapper label + control + error/hint cho form (batch ⑩ worker B, VU-53).
// error (text-st-fail, role=alert) ưu tiên hơn hint; id error/hint suy từ htmlFor
// (`{htmlFor}-error` / `{htmlFor}-hint`) để consumer nối aria-describedby trên input.
import type { ReactNode } from 'react';

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  /** Message lỗi — hiển thị thay hint, id `{htmlFor}-error`. */
  error?: string;
  /** Gợi ý — chỉ hiện khi KHÔNG có error, id `{htmlFor}-hint`. */
  hint?: string;
  /** Dấu * trên label (aria-hidden) — báo hiệu bắt buộc. */
  required?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, required, children, className }: FieldProps) {
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;
  const hintId = !error && hint && htmlFor ? `${htmlFor}-hint` : undefined;
  return (
    // error xuất hiện → wrapper shake 1 lần (bp-shake 400ms; replay chỉ khi error
    // được gỡ rồi mới hiện lại — animation gắn theo class)
    <div className={`${error ? 'animate-[bp-shake_400ms_var(--ease-toggle)]' : ''}${className ? ` ${className}` : ''}`}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-label font-medium text-ink">
          {label}
          {required && (
            <span className="ml-0.5 text-st-fail" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-meta text-st-fail">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-meta text-ink3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
