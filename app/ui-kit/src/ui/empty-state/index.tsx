// EmptyState — tiêu đề + mô tả + optional action. Identity Orbit (PO duyệt
// 2026-10-20): khi KHÔNG truyền `image`, mặc định render SonarMark mờ nổi trôi
// (D6 empty icon float) thay vì trống trơn; `image` tuỳ ý vẫn đè mặc định.
import type { ReactNode } from 'react';
import { SonarMark } from '../icons/index.js';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Slot hình minh hoạ (antd image) — bỏ trống → SonarMark mờ mặc định. */
  image?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, image, className }: EmptyStateProps) {
  return (
    <div className={`bp-empty${className ? ` ${className}` : ''}`}>
      <div className="bp-empty__image animate-[bp-float_3s_ease-in-out_infinite]">
        {image ?? <SonarMark size={44} className="mx-auto text-ink3 opacity-40" />}
      </div>
      <p className="bp-empty__title">{title}</p>
      {description && <p className="bp-empty__description">{description}</p>}
      {action && <div className="bp-empty__action">{action}</div>}
    </div>
  );
}
