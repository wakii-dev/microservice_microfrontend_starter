// Backdrop — scrim toàn màn hình (motion-effects W8, 0 deps): nền token
// --scrim-4 (backdrop toàn màn — KHÔNG bg-black/85 tự chế), z var(--z-modal),
// fade-in nhanh. `onClick` cho consumer tự đóng (không tự quản state); children
// để thả Spinner/giữa màn. Không tự portal — đặt trong portal của consumer
// (pattern Modal/Drawer).
import type { ReactNode } from 'react';

export interface BackdropProps {
  /** Mở scrim (controlled — consumer giữ state). */
  open: boolean;
  /** Click scrim (đóng/tuỳ ý) — click vào children vẫn bubble lên. */
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export function Backdrop({ open, onClick, className, children }: BackdropProps) {
  if (!open) return null;
  return (
    <div
      data-testid="backdrop"
      aria-hidden="true"
      onClick={onClick}
      className={`fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-scrim-4 animate-[bp-fade-in_var(--motion-base)_var(--ease-smooth)]${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}
