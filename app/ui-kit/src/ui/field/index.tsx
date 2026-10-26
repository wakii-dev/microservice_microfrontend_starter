// Field — wrapper label + control + error/hint cho form (batch ⑩ worker B, VU-53).
// error (text-st-fail, role=alert) ưu tiên hơn hint; id error/hint suy từ htmlFor
// (`{htmlFor}-error` / `{htmlFor}-hint`) để consumer nối aria-describedby trên input.
// Customize pass (slots wave 3): classNames slots (root/label/error/hint) +
// style passthrough — default path (không truyền) giữ nguyên DOM/behavior.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định (consumer append). */
export interface FieldClassNames {
  /** Div wrapper ngoài — cùng element với className prop. */
  root?: string;
  /** <label> trên control (chỉ render khi có label). */
  label?: string;
  /** <p> role=alert message lỗi (ưu tiên hơn hint). */
  error?: string;
  /** <p> gợi ý — chỉ hiện khi KHÔNG có error. */
  hint?: string;
}

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
  /** Inline style — passthrough lên div wrapper ngoài. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định. */
  classNames?: FieldClassNames;
}

export function Field(props: FieldProps) {
  const { label, htmlFor, error, hint, required, children, className, style } = props;
  const slots = props.classNames;
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;
  const hintId = !error && hint && htmlFor ? `${htmlFor}-hint` : undefined;
  return (
    // error xuất hiện → wrapper shake 1 lần (bp-shake 400ms; replay chỉ khi error
    // được gỡ rồi mới hiện lại — animation gắn theo class)
    <div
      className={classNames(error ? 'animate-[bp-shake_400ms_var(--ease-toggle)]' : '', slots?.root, className)}
      style={style}
    >
      {label && (
        <label htmlFor={htmlFor} className={classNames('mb-1 block text-label font-medium text-ink', slots?.label)}>
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
        <p id={errorId} role="alert" className={classNames('mt-1 text-meta text-st-fail', slots?.error)}>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={classNames('mt-1 text-meta text-ink3', slots?.hint)}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
