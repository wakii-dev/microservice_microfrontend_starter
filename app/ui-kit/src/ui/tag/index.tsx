// Tag — nhãn + CheckableTag (filter chips). Checkable giữ <button aria-pressed> —
// a11y TỐT HƠN antd (span + onClick không có semantic). Checked = nền accent solid
// (antd CheckableTag checked); unchecked = viền line, chữ ink3 (mirror tsk-chip cũ).
// Customize pass (SÓNG-3): Tag + Tag.Checkable slots (root) + style passthrough —
// comp 1 phần tử chính nên chỉ có slot root; default path giữ nguyên DOM/GUI.
import classnames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../icons/index.js';

/** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định (consumer append).
 * Tag 1 phần tử chính → chỉ có slot root. */
export interface TagClassNames {
  /** <span> nhãn gốc — cùng element với className prop. */
  root?: string;
}

export interface TagProps {
  children: ReactNode;
  /** Icon trước nhãn. */
  icon?: ReactNode;
  /** Nút × — gọi onClose (antd closable; KHÔNG tự remove — consumer quyết định). */
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  /** Inline style — passthrough lên <span> gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: TagClassNames;
}

/** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định (consumer append).
 * Checkable 1 phần tử chính → chỉ có slot root. */
export interface CheckableTagClassNames {
  /** <button> chip — cùng element với className prop. */
  root?: string;
}

export interface CheckableTagProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Icon trước nhãn. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Inline style — passthrough lên <button>. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: CheckableTagClassNames;
}

// eslint-disable-next-line react-refresh/only-export-components
function TagBase({ children, icon, closable = false, onClose, className, style, classNames }: TagProps) {
  return (
    <span
      className={classnames('inline-flex items-center gap-1 rounded-pill border border-line bg-s3 px-2 py-0.5 text-label text-ink2', classNames?.root, className)}
      style={style}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
      {closable && (
        <button
          type="button"
          aria-label="Đóng"
          className="cursor-pointer border-none bg-transparent text-ink3 transition-colors hover:text-ink active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          onClick={() => onClose?.()}
        >
          <Icon name="times" size={12} />
        </button>
      )}
    </span>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
function Checkable({ checked, onChange, icon, children, className, style, classNames }: CheckableTagProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange?.(!checked)}
      style={style}
      className={classnames(
        'inline-flex cursor-pointer items-center gap-1 rounded-pill border px-3 py-1 text-label transition-colors active:opacity-80 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none',
        checked
          ? 'border-accent bg-accent text-white hover:border-accent-hi hover:bg-accent-hi'
          : 'border-line bg-transparent text-ink3 hover:border-line2 hover:text-ink2',
        classNames?.root,
        className,
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

/** Tag + Tag.Checkable — composite component pattern antd (Tag.CheckableTag). */
export const Tag = Object.assign(TagBase, { Checkable });
