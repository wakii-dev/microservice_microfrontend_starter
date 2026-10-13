// Badge — pill chấm-màu + nhãn, role="status" (hand-off §3, story VU-53 SF-1).
// 4 task status + 5 activity action; màu dot + nền 12% alpha map qua CSS class
// bp-badge--{variant} (xem styles/base.css section Primitives).
import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'todo'
  | 'doing'
  | 'done'
  | 'failed' // task status (dot #8a8f98/#f2c94c/#3fb950/#f06a6a)
  | 'created'
  | 'updated'
  | 'assigned'
  | 'deleted'
  | 'assignmentFailed'; // activity action

export interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`bp-badge bp-badge--${variant}`} role="status">
      <span className="bp-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
