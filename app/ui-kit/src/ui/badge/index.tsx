// Badge — 2 mode (antd-lite):
// 1) status-pill (mặc định): variant + children — dot màu + nền 12% (role=status,
//    hand-off §3, story VU-53 SF-1).
// 2) count/standalone (antd Badge): count/overflowCount(99+)/showZero/dot bọc children
//    ở góc phải-trên (offset dịch px); status (success/processing/error/warning/default)
//    + text → standalone dot + label, không cần children.
// Tailwind v4 migration: màu variant qua CSS var --_dot (dot + nền 12% color-mix kế
// thừa cùng var); tokens vẫn nguồn duy nhất (@theme inline trong styles/tailwind.css).
import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'todo'
  | 'doing'
  | 'done'
  | 'failed' // task status
  | 'created'
  | 'updated'
  | 'assigned'
  | 'deleted'
  | 'assignmentFailed'; // activity action

/** Màu dot theo variant — arbitrary property set --_dot cho cả dot + nền color-mix. */
const DOT_VAR: Record<BadgeVariant, string> = {
  todo: '[--_dot:var(--st-todo)]',
  doing: '[--_dot:var(--st-doing)]',
  done: '[--_dot:var(--st-done)]',
  failed: '[--_dot:var(--st-fail)]',
  created: '[--_dot:var(--accent)]',
  updated: '[--_dot:var(--st-doing)]',
  assigned: '[--_dot:var(--accent-hi)]',
  deleted: '[--_dot:var(--ink3)]',
  assignmentFailed: '[--_dot:var(--st-fail)]',
};

export type BadgeStatus = 'success' | 'processing' | 'error' | 'warning' | 'default';

/** Status chuẩn antd → tokens hệ (processing = accent vì --st-doing là gold dành cho warning). */
const STATUS_VAR: Record<BadgeStatus, string> = {
  success: '[--_dot:var(--st-done)]',
  processing: '[--_dot:var(--accent)]',
  error: '[--_dot:var(--st-fail)]',
  warning: '[--_dot:var(--st-doing)]',
  default: '[--_dot:var(--st-todo)]',
};

const STATUS_ARIA: Record<BadgeStatus, string> = {
  success: 'success',
  processing: 'processing',
  error: 'error',
  warning: 'warning',
  default: 'default',
};

export interface BadgeProps {
  /** Status-pill mode — dot màu + nền 12%. Mặc định 'todo'. */
  variant?: BadgeVariant;
  children?: ReactNode;
  className?: string;
  /** Count mode — pill accent góc phải-trên của children (antd count). */
  count?: number;
  /** Mốc tràn — count lớn hơn hiển thị "99+" (antd overflowCount, mặc định 99). */
  overflowCount?: number;
  /** false (mặc định): count = 0 ẩn badge (antd showZero). */
  showZero?: boolean;
  /** Chỉ chấm, không số (antd dot). */
  dot?: boolean;
  /** Standalone status dot + text (không cần children) — antd status. */
  status?: BadgeStatus;
  /** Label đi kèm status dot. */
  text?: ReactNode;
  /** Dịch badge [x, y] px từ góc mặc định (antd offset). */
  offset?: [number, number];
}

const SUP =
  'absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-pill bg-accent px-1 text-[10px] font-semibold leading-4 text-white tabular-nums';
/** Counter pop khi giá trị đổi (key=label re-mount) — depth contract, reduced-motion tắt. */
const POP = 'animate-[bp-zoom-in_200ms_var(--ease-smooth)] motion-reduce:animate-none';

export function Badge({
  variant = 'todo',
  children,
  className,
  count,
  overflowCount = 99,
  showZero = false,
  dot = false,
  status,
  text,
  offset,
}: BadgeProps) {
  const offsetStyle = offset ? { transform: `translate(${offset[0]}px, ${offset[1]}px)` } : undefined;

  // Standalone status dot + text (antd status)
  if (status) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-meta text-ink2${className ? ` ${className}` : ''}`}>
        <span
          aria-hidden="true"
          className={`size-2 rounded-pill ${STATUS_VAR[status]} bg-[var(--_dot)]`}
        />
        {text ?? <span className="sr-only">{STATUS_ARIA[status]}</span>}
      </span>
    );
  }

  // Count mode — bọc children (hoặc standalone khi không có children)
  if (count !== undefined || dot) {
    const hidden = !dot && count === 0 && !showZero;
    const label = dot ? '' : count !== undefined && count > overflowCount ? `${overflowCount}+` : String(count ?? '');

    if (children) {
      return (
        <span className={`relative inline-flex${className ? ` ${className}` : ''}`}>
          {children}
          {!hidden && (
            <sup
              key={label}
              className={`${POP} ${SUP} ${dot ? 'size-2 min-w-2 !p-0' : ''}`}
              style={offsetStyle}
            >
              {label}
            </sup>
          )}
        </span>
      );
    }

    // Standalone count (không children)
    if (hidden) return null;
    return (
      <span
        key={label}
        className={`${POP} inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent px-1 text-[10px] font-semibold leading-4 text-white tabular-nums ${dot ? 'size-2 min-w-2 !p-0' : ''}${className ? ` ${className}` : ''}`}
        style={offsetStyle}
      >
        {label}
      </span>
    );
  }

  // Status-pill mode (mặc định) — dot + label trên nền 12%
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill py-0.5 px-2 text-meta leading-tight whitespace-nowrap text-ink2 bg-[color-mix(in_srgb,var(--_dot)_12%,transparent)] ${DOT_VAR[variant]}${className ? ` ${className}` : ''}`} role="status">
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full bg-[var(--_dot)]${
          variant === 'failed' ? ' animate-[bp-pulse-soft_2s_ease-in-out_infinite]' : ''
        }`}
      />
      {children}
    </span>
  );
}
