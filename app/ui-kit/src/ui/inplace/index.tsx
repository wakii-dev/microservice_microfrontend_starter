// Inplace — click-to-edit toggle (antd lite). Depth contract 2026-10-19:
// hover tint accent/4 + press chìm 1px, transition ease-smooth 240ms.
// Customize pass (slots wave 3): classNames slots (root/display/content/close)
// + style passthrough — default path (không truyền) giữ nguyên DOM/behavior.
import classNames from 'classnames';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../icons/index.js';

/** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định (consumer append). */
export interface InplaceClassNames {
  /** Div gốc bọc 2 trạng thái — cùng element với className prop. */
  root?: string;
  /** Button display (trạng thái đóng, border-dashed). */
  display?: string;
  /** Span row form edit (trạng thái mở). */
  content?: string;
  /** Button × đóng form edit. */
  close?: string;
}

export interface InplaceProps {
  /** Nội dung hiển thị khi đóng. */
  display: ReactNode;
  /** Nội dung edit form khi mở. */
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định. */
  classNames?: InplaceClassNames;
}

export function Inplace(props: InplaceProps) {
  const { display, children, onClose, className, style } = props;
  const slots = props.classNames;
  const [open, setOpen] = useState(false);
  return (
    <div className={classNames(slots?.root, className)} style={style}>
      {open ? (
        <span className={classNames('inline-flex items-center gap-2', slots?.content)}>
          {children}
          <button type="button" aria-label="Đóng" onClick={() => { setOpen(false); onClose?.(); }}
            className={classNames('cursor-pointer border-none bg-transparent text-label text-ink3 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none', slots?.close)}><Icon name="times" size={12} /></button>
        </span>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className={classNames('cursor-pointer rounded-lg border border-dashed border-line bg-transparent px-2 py-1 text-body text-ink2 transition-[color,border-color,background-color,transform] duration-[240ms] [transition-timing-function:var(--ease-smooth)] hover:border-accent hover:bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] hover:text-ink active:translate-y-px focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none', slots?.display)}>
          {display}
        </button>
      )}
    </div>
  );
}
