// EmptyState — tiêu đề + mô tả + optional action; KHÔNG icon (hand-off §3, SF-1).
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Slot hình minh hoạ (antd image) — mặc định KHÔNG icon (hand-off §3). */
  image?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, image, className }: EmptyStateProps) {
  return (
    <div className={`bp-empty${className ? ` ${className}` : ''}`}>
      {image && <div className="bp-empty__image animate-[bp-float_3s_ease-in-out_infinite]">{image}</div>}
      <p className="bp-empty__title">{title}</p>
      {description && <p className="bp-empty__description">{description}</p>}
      {action && <div className="bp-empty__action">{action}</div>}
    </div>
  );
}
