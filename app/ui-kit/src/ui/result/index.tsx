// Result — trang kết quả (antd): icon lớn màu status + title + subTitle + extra.
// Icon status = Icon SVG bộ chung (style sweep 2026-10-23 — bỏ glyph ký tự text);
// success giữ SVG check-draw vẽ tay (motion waves); 404/500 là CHỮ SỐ cố ý, không glyph.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '../icons/index.js';

export type ResultStatus = 'success' | 'error' | 'info' | 'warning' | '404' | '500';

const CONFIG: Record<string, { icon: IconName | '404' | '500'; color: string; defaultTitle: string }> = {
  success: { icon: 'check', color: 'var(--st-done)', defaultTitle: 'Thành công' },
  error: { icon: 'times', color: 'var(--st-fail)', defaultTitle: 'Có lỗi xảy ra' },
  info: { icon: 'info-circle', color: 'var(--accent)', defaultTitle: 'Thông tin' },
  warning: { icon: 'exclamation-triangle', color: 'var(--st-doing)', defaultTitle: 'Cảnh báo' },
  '404': { icon: '404', color: 'var(--ink)', defaultTitle: 'Không tìm thấy trang' },
  '500': { icon: '500', color: 'var(--ink)', defaultTitle: 'Lỗi máy chủ' },
};

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface ResultClassNames {
  /** Div gốc giữa màn. */
  root?: string;
  /** Khối icon status (svg check / wrapper icon). */
  icon?: string;
  /** Dòng tiêu đề. */
  title?: string;
  /** Dòng phụ dưới tiêu đề. */
  subTitle?: string;
  /** Hàng actions dưới cùng. */
  extra?: string;
}

export interface ResultProps {
  /** Trạng thái — icon + màu + title mặc định theo status. */
  status?: ResultStatus;
  /** Tiêu đề (bỏ qua → dùng defaultTitle theo status). */
  title?: ReactNode;
  /** Dòng phụ dưới tiêu đề. */
  subTitle?: ReactNode;
  /** Nút actions (vd Quay lại trang chủ). */
  extra?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: ResultClassNames;
}

export function Result(props: ResultProps) {
  const { status = 'info', title, subTitle, extra, children, className, style } = props;
  const slots = props.classNames;
  const cfg = CONFIG[status];
  return (
    <div
      className={classNames(
        'flex flex-col items-center gap-2 py-8 text-center animate-[bp-slide-up-in_var(--motion-slow)_var(--ease-enter)]',
        slots?.root,
        className,
      )}
      style={style}
    >
      {status === 'success' ? (
        // Success — check vẽ tay (bp-check-draw): circle + tick stroke pathLength=1,
        // offset 1→0 chạy đúng mọi độ dài path. reduced-motion → hiện tức thì.
        <svg aria-hidden="true" data-testid="result-check" viewBox="0 0 52 52" className={classNames('size-14 text-st-done', slots?.icon)}>
          <circle
            cx="26" cy="26" r="23" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.45"
            pathLength={1} strokeDasharray={1}
            style={{ animation: 'bp-check-draw 320ms var(--ease-enter) both' }}
          />
          <path
            d="M16 27l7.5 7.5L37 20" fill="none" stroke="currentColor" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round"
            pathLength={1} strokeDasharray={1}
            style={{ animation: 'bp-check-draw 420ms 200ms var(--ease-enter) both' }}
          />
        </svg>
      ) : (
        <div
          aria-hidden="true"
          data-testid="result-icon"
          className={classNames(
            status === 'error' ? 'text-st-fail' : status === 'warning' ? 'text-st-doing' : 'text-ink',
            slots?.icon,
          )}
          style={status === 'error' || status === 'info' || status === 'warning' ? { color: cfg.color } : undefined}
        >
          {cfg.icon === '404' || cfg.icon === '500' ? (
            <span className="text-5xl font-bold">{cfg.icon}</span>
          ) : (
            // 40px — tương đương khối glyph text-5xl cũ (SVG stroke mảnh hơn font nên giữ gần khung)
            <Icon name={cfg.icon} size={40} />
          )}
        </div>
      )}
      <div className={classNames('text-h2 font-semibold text-ink', slots?.title)}>{title ?? cfg.defaultTitle}</div>
      {subTitle && <div className={classNames('text-body text-ink2', slots?.subTitle)}>{subTitle}</div>}
      {children}
      {extra && <div className={classNames('mt-2 flex gap-2', slots?.extra)}>{extra}</div>}
    </div>
  );
}
