// EmptyState — tiêu đề + mô tả + optional action; KHÔNG icon (hand-off §3, SF-1).
// Customize pass (slots wave 3): classNames slots (root/image/title/description/
// action) + style passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes kiểu antd v5 — merge sau class mặc định (consumer append). */
export interface EmptyStateClassNames {
  /** Div gốc bọc toàn bộ (nơi className prop cũng dính). */
  root?: string;
  /** Div bọc hình minh hoạ — chỉ render khi có image. */
  image?: string;
  /** <p> tiêu đề. */
  title?: string;
  /** <p> mô tả — chỉ render khi có description. */
  description?: string;
  /** Div action dưới cùng — chỉ render khi có action. */
  action?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Slot hình minh hoạ (antd image) — mặc định KHÔNG icon (hand-off §3). */
  image?: ReactNode;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 — merge sau class mặc định. */
  classNames?: EmptyStateClassNames;
}

export function EmptyState(props: EmptyStateProps) {
  const { title, description, action, image, className, style } = props;
  return (
    <div className={classNames('bp-empty', props.classNames?.root, className)} style={style}>
      {image && <div className={classNames('bp-empty__image animate-[bp-float_3s_ease-in-out_infinite]', props.classNames?.image)}>{image}</div>}
      <p className={classNames('bp-empty__title', props.classNames?.title)}>{title}</p>
      {description && <p className={classNames('bp-empty__description', props.classNames?.description)}>{description}</p>}
      {action && <div className={classNames('bp-empty__action', props.classNames?.action)}>{action}</div>}
    </div>
  );
}
