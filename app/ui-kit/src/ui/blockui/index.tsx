// BlockUI — overlay chặn tương tác (antd lite: mask scrim var(--mask), z theo thang --z-*).
// Customize pass (slots wave 3): classNames slots (root/mask/message) + style
// passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface BlockUIClassNames {
  /** Div gốc bọc children (position relative). */
  root?: string;
  /** Overlay phủ khi blocked. */
  mask?: string;
  /** Span message giữa overlay. */
  message?: string;
}

export interface BlockUIProps {
  /** true = phủ overlay chặn tương tác lên children. */
  blocked: boolean;
  /** Nội dung bị khoá. */
  children: ReactNode;
  /** Message hiển thị giữa overlay. */
  message?: string;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: BlockUIClassNames;
}

export function BlockUI(props: BlockUIProps) {
  const { blocked, children, message, className, style } = props;
  const slots = props.classNames;
  return (
    <div className={classNames('relative', slots?.root, className)} style={style}>
      {children}
      {blocked && (
        <div
          className={classNames(
            'absolute inset-0 z-[var(--z-popover)] flex items-center justify-center rounded-[inherit] bg-[var(--mask)]',
            slots?.mask,
          )}
        >
          {message && <span className={classNames('text-body font-medium text-white', slots?.message)}>{message}</span>}
        </div>
      )}
    </div>
  );
}
