// Descriptions — danh sách mô tả (antd lite): rows label (secondary) : value;
// bordered variant = cell viền; layout 1 cột (column nhiều cột = backlog).
// Customize pass (slots wave 3): classNames slots (root/title/item/label/content)
// + style passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

export interface DescriptionsItem {
  /** Nhãn (cột trái — bg-s3, text-ink2). */
  label: ReactNode;
  /** Giá trị (cột phải — text-ink). */
  children: ReactNode;
}

/** Slot classes kiểu antd v5 — merge sau class mặc định (consumer append). */
export interface DescriptionsClassNames {
  /** Div gốc bọc title + dl (nơi className prop cũng dính). */
  root?: string;
  /** Div tiêu đề — chỉ render khi có title. */
  title?: string;
  /** Div hàng — bọc 1 cặp dt/dd. */
  item?: string;
  /** <dt> nhãn. */
  label?: string;
  /** <dd> giá trị. */
  content?: string;
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
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 — merge sau class mặc định. */
  classNames?: DescriptionsClassNames;
}

export function Descriptions(props: DescriptionsProps) {
  const { title, items, bordered = false, size = 'default', colon = false, className, style } = props;
  const pad = size === 'small' ? 'p-2' : 'p-3';
  const labelW = size === 'small' ? 'w-32' : 'w-40';
  return (
    <div className={classNames(props.classNames?.root, className)} style={style}>
      {title && <div className={classNames('mb-2 text-h2 font-semibold text-ink', props.classNames?.title)}>{title}</div>}
      <dl className="m-0 overflow-hidden rounded-xl">
        {items.map((item, i) => (
          <div
            key={i}
            className={classNames(
              'flex',
              bordered ? 'border border-line2' : 'border-b border-line2',
              bordered && i > 0 ? 'border-t-0' : '',
              props.classNames?.item,
            )}
          >
            <dt
              className={classNames(
                labelW,
                'shrink-0 bg-s3',
                pad,
                'text-body text-ink2',
                bordered ? 'border-r border-line2' : '',
                props.classNames?.label,
              )}
            >
              {item.label}
              {colon && <span aria-hidden="true" className="mr-1">:</span>}
            </dt>
            <dd className={classNames('m-0', pad, 'text-body text-ink', bordered ? '' : 'flex-1', props.classNames?.content)}>
              {item.children}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
