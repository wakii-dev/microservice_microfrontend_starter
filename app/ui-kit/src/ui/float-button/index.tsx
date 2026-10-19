// FloatButton — nút nổi góc màn hình (antd FloatButton lite) + Group mở cụm
// (trigger hover/click) + BackTop tích hợp (hiện sau ngưỡng cuộn, về đầu trang).
// Depth contract 2026-10-19 (Geist): hover nhấc 1px + viền đậm mực 20% + ele-3
// chồng shadow-pop, press chìm 1px nén bóng (ele-1), icon slide 2px, wash sheen,
// stagger cụm 40ms ease-smooth — không scale lòe loẹt.
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
      className={`group grid size-10 cursor-pointer place-items-center border border-line bg-s1 text-ink2 [background-image:var(--wash)] shadow-[var(--shadow-pop)] transition-[color,background-color,border-color,box-shadow,transform] duration-[240ms] [transition-timing-function:var(--ease-smooth)] hover:-translate-y-px hover:bg-s2 hover:text-accent hover:border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:shadow-[var(--shadow-pop),var(--ele-3)] active:translate-y-px active:shadow-[var(--ele-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${radius}${className ? ` ${className}` : ''}`}
    >
      <span className="grid place-items-center transition-transform duration-[240ms] [transition-timing-function:var(--ease-smooth)] group-hover:translate-x-0.5">
        {icon}
      </span>
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
        <div role="menu" className="flex flex-col items-center gap-2 animate-[bp-zoom-in_var(--motion-base)_var(--ease-smooth)]">
          {items.map((child, i) => (
            <div key={i} role="none" style={{ animation: `bp-slide-up-in 240ms var(--ease-smooth) ${(items.length - 1 - i) * 40}ms both` }}>
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
        className="grid size-12 cursor-pointer place-items-center rounded-pill border-none bg-accent text-xl text-white shadow-[var(--shadow-pop)] transition-[box-shadow,transform] duration-[240ms] [transition-timing-function:var(--ease-smooth)] hover:shadow-[var(--shadow-pop),var(--ele-3)] active:translate-y-px active:shadow-[var(--ele-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 [&>svg]:text-white"
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
          className="group grid size-10 animate-[bp-fade-in_var(--motion-base)_var(--ease-smooth)] cursor-pointer place-items-center rounded-pill border border-line bg-s1 text-ink2 [background-image:var(--wash)] shadow-[var(--shadow-pop)] transition-[color,background-color,border-color,box-shadow,transform] duration-[240ms] [transition-timing-function:var(--ease-smooth)] hover:-translate-y-px hover:bg-s2 hover:text-accent hover:border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:shadow-[var(--shadow-pop),var(--ele-3)] active:translate-y-px active:shadow-[var(--ele-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <span className="grid place-items-center transition-transform duration-[240ms] [transition-timing-function:var(--ease-smooth)] group-hover:-translate-y-0.5">
            <Icon name="chevron-up" size={16} />
          </span>
        </button>
      )}
    </div>
  );
}

/** Sub-component: <FloatButton.BackTop /> (antd style). */
(FloatButton as unknown as { BackTop: typeof FloatButtonBackTop }).BackTop = FloatButtonBackTop;
