// EmptyState — tiêu đề + mô tả + optional action; KHÔNG icon (hand-off §3, SF-1).
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="bp-empty">
      <p className="bp-empty__title">{title}</p>
      {description && <p className="bp-empty__description">{description}</p>}
      {action && <div className="bp-empty__action">{action}</div>}
    </div>
  );
}
