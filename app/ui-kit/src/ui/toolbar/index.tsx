// Toolbar — flex container start/end (antd Toolbar lite).
// slots-wave: classNames root/start/end + style passthrough — default giữ nguyên DOM.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface ToolbarClassNames {
  /** Div gốc (justify-between). */
  root?: string;
  /** Div cụm trái (children). */
  start?: string;
  /** Div cụm phải (extra) — chỉ render khi có extra. */
  end?: string;
}

export interface ToolbarProps {
  children: ReactNode;
  /** Node bên phải. */
  extra?: ReactNode;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: ToolbarClassNames;
}

export function Toolbar(props: ToolbarProps) {
  const { children, extra, className, style } = props;
  const slots = props.classNames;
  return (
    <div
      className={classNames('flex flex-wrap items-center justify-between gap-2', slots?.root, className)}
      style={style}
    >
      <div className={classNames('flex items-center gap-2', slots?.start)}>{children}</div>
      {extra && <div className={classNames('flex items-center gap-2', slots?.end)}>{extra}</div>}
    </div>
  );
}
