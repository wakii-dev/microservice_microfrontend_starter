// Descriptions — danh sách mô tả (antd lite): rows label (secondary) : value;
// bordered variant = cell viền; layout 1 cột (column nhiều cột = backlog).
import type { ReactNode } from 'react';

export interface DescriptionsItem {
  label: ReactNode;
  children: ReactNode;
}

export interface DescriptionsProps {
  title?: ReactNode;
  items: DescriptionsItem[];
  bordered?: boolean;
  className?: string;
}

export function Descriptions({ title, items, bordered = false, className }: DescriptionsProps) {
  return (
    <div className={className}>
      {title && <div className="mb-2 text-h2 font-semibold text-ink">{title}</div>}
      <dl className="m-0 overflow-hidden rounded-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex ${bordered ? 'border border-line2' : 'border-b border-line2'} ${bordered && i > 0 ? 'border-t-0' : ''}`}
          >
            <dt className={`w-40 shrink-0 bg-s3 p-3 text-body text-ink2 ${bordered ? 'border-r border-line2' : ''}`}>
              {item.label}
            </dt>
            <dd className={`m-0 p-3 text-body text-ink ${bordered ? '' : 'flex-1'}`}>{item.children}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
