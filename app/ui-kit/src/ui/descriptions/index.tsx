// Descriptions — danh sách mô tả (antd lite): rows label (secondary) : value;
// bordered variant = cell viền; layout 1 cột (column nhiều cột = backlog).
import type { ReactNode } from 'react';

export interface DescriptionsItem {
  /** Nhãn (cột trái — bg-s3, text-ink2). */
  label: ReactNode;
  /** Giá trị (cột phải — text-ink). */
  children: ReactNode;
}

export interface DescriptionsProps {
  /** Tiêu đề phía trên danh sách (text-h2). */
  title?: ReactNode;
  /** Các hàng label : value — render theo thứ tự. */
  items: DescriptionsItem[];
  /** Bordered: mỗi ô viền kín (antd bordered). */
  bordered?: boolean;
  /** 'default' (padding 12, label w-40) | 'small' (padding 8, label w-32 — antd size). */
  size?: 'default' | 'small';
  /** Hiển thị ":" sau label (antd colon — mặc định tắt). */
  colon?: boolean;
  className?: string;
}

export function Descriptions({ title, items, bordered = false, size = 'default', colon = false, className }: DescriptionsProps) {
  const pad = size === 'small' ? 'p-2' : 'p-3';
  const labelW = size === 'small' ? 'w-32' : 'w-40';
  return (
    <div className={className}>
      {title && <div className="mb-2 text-h2 font-semibold text-ink">{title}</div>}
      <dl className="m-0 overflow-hidden rounded-xl">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex ${bordered ? 'border border-line2' : 'border-b border-line2'} ${bordered && i > 0 ? 'border-t-0' : ''}`}
          >
            <dt className={`${labelW} shrink-0 bg-s3 ${pad} text-body text-ink2 ${bordered ? 'border-r border-line2' : ''}`}>
              {item.label}
              {colon && <span aria-hidden="true" className="mr-1">:</span>}
            </dt>
            <dd className={`m-0 ${pad} text-body text-ink ${bordered ? '' : 'flex-1'}`}>{item.children}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
