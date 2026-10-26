// Backdrop — scrim toàn màn hình (motion-effects W8, 0 deps): nền token
// --scrim-4 (backdrop toàn màn — KHÔNG bg-black/85 tự chế), z var(--z-modal),
// fade-in nhanh. `onClick` cho consumer tự đóng (không tự quản state); children
// để thả Spinner/giữa màn. Không tự portal — đặt trong portal của consumer
// (pattern Modal/Drawer).
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface BackdropClassNames {
  /** Div scrim toàn màn hình. */
  root?: string;
}

export interface BackdropProps {
  /** Mở scrim (controlled — consumer giữ state). */
  open: boolean;
  /** Click scrim (đóng/tuỳ ý) — click vào children vẫn bubble lên. */
  onClick?: () => void;
  className?: string;
  /** Inline style — passthrough lên div scrim. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: BackdropClassNames;
  children?: ReactNode;
}

export function Backdrop(props: BackdropProps) {
  const { open, onClick, className, style, children } = props;
  const slots = props.classNames;
  if (!open) return null;
  return (
    <div
      data-testid="backdrop"
      aria-hidden="true"
      onClick={onClick}
      className={classNames(
        'fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-scrim-4 animate-[bp-fade-in_var(--motion-base)_var(--ease-smooth)]',
        slots?.root,
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
