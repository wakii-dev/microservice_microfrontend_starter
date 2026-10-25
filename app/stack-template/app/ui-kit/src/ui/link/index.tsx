// Link — antd Typography.Link / MUI Link parity (docs/parity-matrix.md Gap P0):
// anchor màu text-accent, hover accent-hi + underline theo mode ('none' | 'hover'
// | 'always', mặc định 'hover'), focus ring chuẩn accent/40 (không ring-offset),
// disabled chặn click + bỏ href (không focusable — đúng a11y). Render <a> thuần,
// tokens-only, passthrough anchor props (target/rel/aria-*).
import type { AnchorHTMLAttributes, MouseEvent as ReactMouseEvent, ReactNode } from 'react';

export type LinkUnderline = 'none' | 'hover' | 'always';

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Đích liên kết — bỏ khi disabled. */
  href?: string;
  /** Gạch chân: 'none' | 'hover' | 'always' — mặc định 'hover' (antd Link). */
  underline?: LinkUnderline;
  /** Chặn click + bỏ href + aria-disabled (antd disabled Link). */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

const UNDERLINE: Record<LinkUnderline, string> = {
  none: 'no-underline',
  hover: 'no-underline hover:underline underline-offset-2',
  always: 'underline underline-offset-2',
};

export function Link({
  href,
  underline = 'hover',
  disabled = false,
  className,
  children,
  onClick,
  ...rest
}: LinkProps) {
  if (disabled) {
    return (
      <a
        aria-disabled="true"
        className={`cursor-not-allowed text-ink4 no-underline${className ? ` ${className}` : ''}`}
        onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      onClick={onClick}
      className={`rounded-sm text-accent transition-colors duration-150 hover:text-accent-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${UNDERLINE[underline]}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </a>
  );
}
