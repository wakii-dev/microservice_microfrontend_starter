// Link — antd Typography.Link / MUI Link parity (docs/parity-matrix.md Gap P0):
// anchor màu text-accent, hover accent-hi + underline theo mode ('none' | 'hover'
// | 'always', mặc định 'hover'), focus ring chuẩn accent/40 (không ring-offset),
// disabled chặn click + bỏ href (không focusable — đúng a11y). Render <a> thuần,
// tokens-only, passthrough anchor props (target/rel/aria-*).
import classNames from 'classnames';
import type { AnchorHTMLAttributes, MouseEvent as ReactMouseEvent, ReactNode } from 'react';

export type LinkUnderline = 'none' | 'hover' | 'always';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface LinkClassNames {
  /** <a> gốc (nơi className prop cũng dính). */
  root?: string;
}

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Đích liên kết — bỏ khi disabled. */
  href?: string;
  /** Gạch chân: 'none' | 'hover' | 'always' — mặc định 'hover' (antd Link). */
  underline?: LinkUnderline;
  /** Chặn click + bỏ href + aria-disabled (antd disabled Link). */
  disabled?: boolean;
  className?: string;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: LinkClassNames;
  children: ReactNode;
}

const UNDERLINE: Record<LinkUnderline, string> = {
  none: 'no-underline',
  hover: 'no-underline hover:underline underline-offset-2',
  always: 'underline underline-offset-2',
};

export function Link(props: LinkProps) {
  const {
    href,
    underline = 'hover',
    disabled = false,
    className,
    children,
    onClick,
    ...rest
  } = props;
  const slots = props.classNames;
  if (disabled) {
    return (
      <a
        aria-disabled="true"
        className={classNames('cursor-not-allowed text-ink4 no-underline', slots?.root, className)}
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
      className={classNames(
        'rounded-sm text-accent transition-colors duration-150 hover:text-accent-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        UNDERLINE[underline],
        slots?.root,
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
