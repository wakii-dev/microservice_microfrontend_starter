// Result — trang kết quả (antd): icon glyph lớn màu status + title + subTitle + extra.
import type { ReactNode } from 'react';

export type ResultStatus = 'success' | 'error' | 'info' | 'warning' | '404' | '500';

const CONFIG: Record<string, { icon: string; color: string; defaultTitle: string }> = {
  success: { icon: '✓', color: 'var(--st-done)', defaultTitle: 'Thành công' },
  error: { icon: '✕', color: 'var(--st-fail)', defaultTitle: 'Có lỗi xảy ra' },
  info: { icon: 'ℹ', color: 'var(--accent)', defaultTitle: 'Thông tin' },
  warning: { icon: '⚠', color: 'var(--st-doing)', defaultTitle: 'Cảnh báo' },
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
          className={`text-5xl font-bold ${status === 'error' ? 'text-st-fail' : status === 'warning' ? 'text-st-doing' : 'text-ink'}`}
          style={status === 'error' || status === 'info' || status === 'warning' ? { color: cfg.color } : undefined}
        >
          {cfg.icon}
        </div>
      )}
      <div className="text-h2 font-semibold text-ink">{title ?? cfg.defaultTitle}</div>
      {subTitle && <div className="text-body text-ink2">{subTitle}</div>}
      {children}
      {extra && <div className="mt-2 flex gap-2">{extra}</div>}
    </div>
  );
}
