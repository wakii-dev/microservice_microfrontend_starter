// ButtonGroup — attached row/column of Buttons (MUI ButtonGroup / antd semantics):
// joined borders (-ml-px seam), outer corners keep rounded-lg, size/type cascade via context.
import cx from 'classnames';
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { ButtonGroupContext } from './group-context.js';

/** Slot classes kiểu antd v5 — merge sau class mặc định (consumer append). */
export interface ButtonGroupClassNames {
  /** Div role="group" gốc. */
  root?: string;
}

export interface ButtonGroupProps {
  /** Default size for child Buttons (explicit child prop wins). */
  size?: 'small' | 'middle' | 'large';
  /** Default variant for child Buttons (explicit child prop wins). */
  type?: 'primary' | 'default' | 'text';
  orientation?: 'horizontal' | 'vertical';
  /** REQUIRED a11y — group landmark name (AGENTS.md rule 10). */
  ariaLabel: string;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 — merge sau class mặc định. */
  classNames?: ButtonGroupClassNames;
  children?: ReactNode;
}

const JOINS = {
  horizontal: 'flex-row [&>button:not(:first-child)]:-ml-px [&>button:not(:first-child)]:rounded-l-none [&>button:not(:last-child)]:rounded-r-none',
  vertical:
    'flex-col [&>button:not(:first-child)]:-mt-px [&>button:not(:first-child)]:rounded-t-none [&>button:not(:last-child)]:rounded-b-none',
} as const;

export function ButtonGroup(props: ButtonGroupProps) {
  const { size, type, orientation = 'horizontal', ariaLabel, className, style, classNames: slots, children } = props;
  const ctx = useMemo(() => ({ size, type }), [size, type]);
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx('inline-flex [&>button:focus-visible]:z-[var(--z-stacked)]', JOINS[orientation], slots?.root, className)}
      style={style}
    >
      <ButtonGroupContext.Provider value={ctx}>{children}</ButtonGroupContext.Provider>
    </div>
  );
}
