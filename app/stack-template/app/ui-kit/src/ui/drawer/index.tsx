// Drawer — panel trượt từ phải (antd: width 378, mask, ESC/mask = onClose).
// Motion identity (CSS thuần): slide-in khi mở, slide-out khi đóng — closing state
// machine: open=false → animation chạy XONG (onAnimationEnd) mới unmount.
// A11y (batch ⑫ worker C): focus trap (Tab/Shift+Tab vòng trong panel), mở →
// focus phần tử đầu (nút ×), đóng → trả focus về trigger (capture activeElement).
// Customize pass (slots wave 3): ghép slot qua package classnames (bỏ slot helper).
import classNames from 'classnames';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { Icon } from '../icons/index.js';

/** antd v5-style sub-part slot classes — merge AFTER defaults (consumer appends). */
export interface DrawerClassNames {
  /** Sliding panel (aside). */
  wrapper?: string;
  /** Fullscreen dim overlay. */
  mask?: string;
  /** Title bar. */
  header?: string;
  /** Scrollable body. */
  body?: string;
  /** Footer action row. */
  footer?: string;
}

export interface DrawerProps {
  /** Mở/đóng (đóng có exit animation trước khi unmount). */
  open: boolean;
  /** Tiêu đề header (string → làm aria-label dialog). */
  title?: ReactNode;
  /** px — mặc định 378 (antd). */
  width?: number;
  onClose?: () => void;
  /** Hàng nút cuối panel. */
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: DrawerClassNames;
}

export function Drawer(props: DrawerProps) {
  const { open, title, width = 378, onClose, footer, children, className } = props;
  const slots = props.classNames;
  // A11y: dialog name qua labelledby — ăn cả title ReactNode, không chỉ string.
  const titleId = useId();
  const [mounted, setMounted] = useState(open);
  const closing = mounted && !open;
  const panelRef = useRef<HTMLElement>(null);

  // active = open && mounted: mở → focus đầu; bắt đầu closing → trả focus trigger
  useFocusTrap(panelRef, open && mounted);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // ESC chỉ khi open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Scroll lock giữ tới mounted=false (exit animation XONG)
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={classNames(
        'fixed inset-0 z-[var(--z-modal)] bg-[var(--mask)]',
        closing ? 'animate-[bp-fade-out_var(--motion-fast)_var(--ease-exit)]' : 'animate-[bp-fade-in_var(--motion-base)_var(--ease-enter)]',
        slots?.mask,
      )}
      onClick={() => onClose?.()}
      data-testid="drawer-overlay"
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        className={classNames(
          'absolute inset-y-0 right-0 flex flex-col bg-s2 shadow-[var(--shadow-pop)]',
          closing ? 'animate-[bp-slide-out-right_var(--motion-fast)_var(--ease-exit)]' : 'animate-[bp-slide-in-right_var(--motion-base)_var(--ease-enter)]',
          className,
          slots?.wrapper,
        )}
        style={{ width }}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) setMounted(false);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={classNames('flex items-center justify-between border-b border-line2 px-6 py-4', slots?.header)}>
          <div id={titleId} className="text-h2 font-semibold text-ink">{title}</div>
          <button
            type="button"
            aria-label="Đóng"
            className="cursor-pointer rounded-1 border-none bg-transparent text-base leading-4 text-ink3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:opacity-70"
            onClick={() => onClose?.()}
          >
            <Icon name="times" size={14} />
          </button>
        </header>
        <div className={classNames('flex-1 overflow-auto p-6 text-body text-ink2', slots?.body)}>{children}</div>
        {footer && <footer className={classNames('flex justify-end gap-2 border-t border-line2 p-4', slots?.footer)}>{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
