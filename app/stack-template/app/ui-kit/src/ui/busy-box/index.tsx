// BusyBox — wrapper busy pattern (antd Spin-style, P1 roadmap leftovers):
// busy=true → Skeleton (variant/count) thay nội dung; busy=false → render con.
// Gọn hơn map thủ công loading → Skeleton lặp ở mọi page (TasksPage/ActivityPage cũ).
import type { ReactNode } from 'react';
import { Skeleton } from '../skeleton/index';

export interface BusyBoxProps {
  busy: boolean;
  children: ReactNode;
  /** Skeleton variant khi busy (mặc định row). */
  variant?: 'text' | 'row' | 'card';
  count?: number;
  className?: string;
}

export function BusyBox({ busy, children, variant = 'row', count = 1, className }: BusyBoxProps) {
  if (busy) {
    return (
      <div aria-busy="true" className={className}>
        <Skeleton variant={variant} count={count} />
      </div>
    );
  }
  return <div className={className}>{children}</div>;
}
