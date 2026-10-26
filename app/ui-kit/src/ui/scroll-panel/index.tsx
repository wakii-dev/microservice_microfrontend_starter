// ScrollPanel — custom scrollbar container (antd lite).
// slots-wave: classNames {root} + style passthrough (merge sau height).
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface ScrollPanelClassNames {
  /** Div cuộn gốc. */
  root?: string;
}

export interface ScrollPanelProps {
  children: ReactNode;
  height?: string;
  className?: string;
  /** Inline style — merge SAU height (consumer override được). */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: ScrollPanelClassNames;
}

export function ScrollPanel(props: ScrollPanelProps) {
  const { children, height = '200px', className, style } = props;
  const slots = props.classNames;
  return (
    <div
      className={classNames(
        'overflow-auto rounded-xl border border-line bg-s2 p-3 [scrollbar-width:thin] [scrollbar-color:var(--line)_transparent]',
        slots?.root,
        className,
      )}
      style={{ height, ...style }}
    >
      {children}
    </div>
  );
}
