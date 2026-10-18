// FloatButton — nút nổi góc màn hình (antd FloatButton lite) + Group mở cụm
// (trigger hover/click) + BackTop tích hợp (hiện sau ngưỡng cuộn, về đầu trang).
import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface FloatButtonProps {
  /** Icon từ bộ primeicons (<Icon name size>). */
  icon: ReactNode;
  onClick?: () => void;
  /** circle (mặc định) | square — bo góc pill hay rounded-lg. */
  shape?: 'circle' | 'square';
  /** Nhãn accessible + tooltip khi hover. */
  tooltip?: string;
  className?: string;
}

export function FloatButton({ icon, onClick, shape = 'circle', tooltip, className }: FloatButtonProps) {
  const radius = shape === 'square' ? 'rounded-lg' : 'rounded-pill';
  return (
    <button
      type="button"
      title={tooltip}
      aria-label={tooltip}
      aria-haspopup={undefined}
      onClick={onClick}
      className={`grid size-10 cursor-pointer place-items-center border border-line bg-s1 text-ink2 shadow-[var(--shadow-pop)] transition-colors hover:bg-s2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${radius}${className ? ` ${className}` : ''}`}
    >
      {icon}
    </button>
  );
}

export interface FloatButtonGroupProps {
  /** hover (mặc định) | click — cách mở cụm nút. */
  trigger?: 'hover' | 'click';
  /** Icon nút kích hoạt (mặc định: dấu +). */
  icon?: ReactNode;
  /** Controlled mở/đóng; không truyền → uncontrolled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** aria-label nút kích hoạt. */
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
}

export function FloatButtonGroup({ trigger = 'hover', icon, open, onOpenChange, ariaLabel = 'Thao tác nhanh', children, className }: FloatButtonGroupProps) {
  const [inner, setInner] = useState(false);
  const isOpen = open ?? inner;
  function setOpen(next: boolean) {
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
  }
  const items = Array.isArray(children) ? children : [children];
  return (
    <div
      className={`fixed bottom-6 right-6 z-[var(--z-toast)] flex flex-col items-center gap-2${className ? ` ${className}` : ''}`}
      onMouseEnter={trigger === 'hover' ? () => setOpen(true) : undefined}
      onMouseLeave={trigger === 'hover' ? () => setOpen(false) : undefined}
    >
      {isOpen && (
        <div role="menu" className="flex flex-col items-center gap-2 animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)]">
          {items.map((child, i) => (
            <div key={i} role="none" style={{ animation: `bp-slide-up-in 150ms var(--ease-enter) ${(items.length - 1 - i) * 40}ms both` }}>
              {child}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={trigger === 'click' ? () => setOpen(!isOpen) : undefined}
        className="grid size-12 cursor-pointer place-items-center rounded-pill border-none bg-accent text-xl text-white shadow-[var(--shadow-pop)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 [&>svg]:text-white"
      >
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>{icon ?? <Icon name="plus" size={20} />}</span>
      </button>
    </div>
  );
}

export interface FloatButtonBackTopProps {
  /** Ngưỡng scrollY (px) trước khi hiện — mặc định 400. */
  visibilityHeight?: number;
  tooltip?: string;
  className?: string;
}

/** BackTop — FloatButton về đầu trang, hiện khi scrollY > visibilityHeight. */
export function FloatButtonBackTop({ visibilityHeight = 400, tooltip = 'Về đầu trang', className }: FloatButtonBackTopProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > visibilityHeight);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [visibilityHeight]);
  return (
    <div className={`fixed bottom-6 right-6 z-[var(--z-toast)]${className ? ` ${className}` : ''}`}>
      {visible && (
        <button
          type="button"
          aria-label={tooltip}
          title={tooltip}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="grid size-10 animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)] cursor-pointer place-items-center rounded-pill border border-line bg-s1 text-ink2 shadow-[var(--shadow-pop)] transition-colors hover:bg-s2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Icon name="chevron-up" size={16} />
        </button>
      )}
    </div>
  );
}

/** Sub-component: <FloatButton.BackTop /> (antd style). */
(FloatButton as unknown as { BackTop: typeof FloatButtonBackTop }).BackTop = FloatButtonBackTop;
