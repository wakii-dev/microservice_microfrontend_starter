// Badge — pill chấm-màu + nhãn, role="status" (hand-off §3, story VU-53 SF-1).
// Tailwind v4 migration (spec 2026-10-17-tailwind-migration.md): styles thành utilities,
// màu variant qua CSS var --_dot (dot + nền 12% color-mix kế thừa cùng var) — pixel
// parity với base.css bản cũ; tokens vẫn nguồn duy nhất (@theme inline trong
// styles/tailwind.css). className passthrough (phase 1 API nâng cấp — áp dụng sớm).
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

export interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  /** Append sau structural classes — escape hatch pattern antd (không thắng specificity). */
  className?: string;
}

const ROOT =
  'inline-flex items-center gap-1.5 rounded-pill py-0.5 px-2 text-meta leading-tight whitespace-nowrap text-ink2 bg-[color-mix(in_srgb,var(--_dot)_12%,transparent)]';

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={`${ROOT} ${DOT_VAR[variant]}${className ? ` ${className}` : ''}`} role="status">
      <span className="size-1.5 rounded-full bg-[var(--_dot)]" aria-hidden="true" />
      {children}
    </span>
  );
}
