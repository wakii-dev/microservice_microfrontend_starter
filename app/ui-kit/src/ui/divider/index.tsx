// Divider — đường kẻ phân cách (antd): horizontal margin 16px 0 / vertical 0 8px,
// dashed variant, với text (nền theo context).
// slots-wave: classNames root/label/line + style passthrough — default giữ nguyên DOM.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface DividerClassNames {
  /** Phần tử gốc (div horizontal / span vertical). */
  root?: string;
  /** Span chứa text (chỉ horizontal có children). */
  label?: string;
  /** Span đường kẻ (chỉ horizontal có children). */
  line?: string;
}

export interface DividerProps {
  /** horizontal (mặc định) | vertical — vertical là span inline cao 0.9em. */
  type?: 'horizontal' | 'vertical';
  /** Viền đứt (antd dashed) — mặc định liền. */
  dashed?: boolean;
  /** Vị trí text: 'left' | 'center' (mặc định) | 'right' (antd orientation). */
  orientation?: 'left' | 'center' | 'right';
  /** Text trên đường kẻ (chỉ horizontal). */
  children?: ReactNode;
  className?: string;
  /** Inline style — passthrough lên phần tử gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: DividerClassNames;
}

export function Divider(props: DividerProps) {
  const { type = 'horizontal', dashed = false, orientation = 'center', children, className, style } = props;
  const slots = props.classNames;
  if (type === 'vertical') {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={classNames(
          'inline-block h-[0.9em] w-px align-middle',
          dashed ? 'border-l border-dashed border-line' : 'bg-line',
          slots?.root,
          className,
        )}
        style={{ margin: '0 8px', ...style }}
      />
    );
  }
  const line = `border-t ${dashed ? 'border-dashed border-line' : 'border-solid border-line2'}`;
  if (children !== undefined) {
    if (orientation === 'left') {
      return (
        <div
          role="separator"
          className={classNames('flex items-center text-label text-ink3', slots?.root, className)}
          style={{ margin: '16px 0', ...style }}
        >
          <span className={classNames('mr-4', slots?.label)}>{children}</span>
          <span className={classNames('flex-1', line, slots?.line)} />
        </div>
      );
    }
    if (orientation === 'right') {
      return (
        <div
          role="separator"
          className={classNames('flex items-center text-label text-ink3', slots?.root, className)}
          style={{ margin: '16px 0', ...style }}
        >
          <span className={classNames('flex-1', line, slots?.line)} />
          <span className={classNames('ml-4', slots?.label)}>{children}</span>
        </div>
      );
    }
    return (
      <div
        role="separator"
        className={classNames('flex items-center text-label text-ink3', slots?.root, className)}
        style={{ margin: '16px 0', ...style }}
      >
        <span className={classNames('flex-1', line, slots?.line)} />
        <span className={classNames('px-4', slots?.label)}>{children}</span>
        <span className={classNames('flex-1', line, slots?.line)} />
      </div>
    );
  }
  return (
    <div
      role="separator"
      className={classNames(
        'border-t',
        dashed ? 'border-dashed border-line' : 'border-solid border-line2',
        slots?.root,
        className,
      )}
      style={{ margin: '16px 0', ...style }}
    />
  );
}
