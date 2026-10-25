// Result — trang kết quả (antd): icon lớn màu status + title + subTitle + extra.
// Icon status = Icon SVG bộ chung (style sweep 2026-10-23 — bỏ glyph ký tự text);
// success giữ SVG check-draw vẽ tay (motion waves); 404/500 là CHỮ SỐ cố ý, không glyph.
import type { ReactNode } from 'react';
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
}

export function Result({ status = 'info', title, subTitle, extra, children, className }: ResultProps) {
  const cfg = CONFIG[status];
  return (
    <div className={`flex flex-col items-center gap-2 py-8 text-center animate-[bp-slide-up-in_var(--motion-slow)_var(--ease-enter)]${className ? ` ${className}` : ''}`}>
      {status === 'success' ? (
        // Success — check vẽ tay (bp-check-draw): circle + tick stroke pathLength=1,
        // offset 1→0 chạy đúng mọi độ dài path. reduced-motion → hiện tức thì.
        <svg aria-hidden="true" data-testid="result-check" viewBox="0 0 52 52" className="size-14 text-st-done">
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
          className={status === 'error' ? 'text-st-fail' : status === 'warning' ? 'text-st-doing' : 'text-ink'}
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
      <div className="text-h2 font-semibold text-ink">{title ?? cfg.defaultTitle}</div>
      {subTitle && <div className="text-body text-ink2">{subTitle}</div>}
      {children}
      {extra && <div className="mt-2 flex gap-2">{extra}</div>}
    </div>
  );
}
