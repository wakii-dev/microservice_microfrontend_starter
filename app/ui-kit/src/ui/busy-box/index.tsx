// BusyBox — wrapper busy pattern (antd Spin-style, P1 roadmap leftovers):
// busy=true → Skeleton (variant/count) thay nội dung; busy=false → render con.
// Gọn hơn map thủ công loading → Skeleton lặp ở mọi page (TasksPage/ActivityPage cũ).
// Customize pass (slots wave 3): classNames slot root + style passthrough —
// default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '../skeleton/index.js';

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface BusyBoxClassNames {
  /** Div gốc (bọc skeleton khi busy / children khi rảnh). */
  root?: string;
}

export interface BusyBoxProps {
  busy: boolean;
  children: ReactNode;
  /** Skeleton variant khi busy (mặc định row). */
  variant?: 'text' | 'row' | 'card';
  count?: number;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: BusyBoxClassNames;
}

export function BusyBox(props: BusyBoxProps) {
  const { busy, children, variant = 'row', count = 1, className, style } = props;
  const slots = props.classNames;
  const rootClass = classNames(slots?.root, className);
  if (busy) {
    return (
      <div aria-busy="true" className={rootClass} style={style}>
        <Skeleton variant={variant} count={count} />
      </div>
    );
  }
  return (
    <div className={rootClass} style={style}>
      {children}
    </div>
  );
}
