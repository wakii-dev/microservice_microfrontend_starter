// PingFeed — feed hoạt động đội (Team-OS): Timeline style + màu theo kind
// (start=accent · milestone=done · report=ink · blocked=st-fail) + Avatar actor
// + timestamp relative + stagger mount 30ms + pulse badge khi có blocked.
// Depth: panel ele-1 + wash; motion --ease-smooth; reduced-motion tắt qua block global.
import type { ReactNode } from 'react';
import { Avatar } from '../../avatar/index';
import { Icon } from '../../icons/index.js';

export type PingKind = 'start' | 'milestone' | 'report' | 'blocked' | 'idle-alert';

export interface PingEvent {
  /** Thời điểm (Date hoặc ISO string) — render relative timestamp. */
  at: string | Date;
  /** Tên actor — 2 ký tự đầu làm Avatar initials. */
  actor: string;
  kind: PingKind;
  /** Nội dung dòng feed (ReactNode cho phép nhấn mạnh inline). */
  text: ReactNode;
}

export interface PingFeedProps {
  events: PingEvent[];
  /** Tiêu đề panel (mặc định 'Team ping'). */
  title?: ReactNode;
  className?: string;
}

const KIND_META: Record<PingKind, { color: string; icon: string; label: string }> = {
  start: { color: 'var(--accent)', icon: 'arrow-right', label: 'start' },
  milestone: { color: 'var(--st-done)', icon: 'check-circle', label: 'milestone' },
  report: { color: 'var(--ink3)', icon: 'file', label: 'report' },
  blocked: { color: 'var(--st-fail)', icon: 'times', label: 'blocked' },
  'idle-alert': { color: 'var(--st-doing)', icon: 'info-circle', label: 'idle-alert' },
};

/** Khoảng thời gian tương đối (vi) — deterministic theo mốc now. */
// eslint-disable-next-line react-refresh/only-export-components -- util nhỏ dùng chung team/ (precedent: table STRING_MODES)
export function relTime(at: string | Date, now: Date = new Date()): string {
  const d = typeof at === 'string' ? new Date(at) : at;
  const m = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60000));
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export function PingFeed({ events, title = 'Team ping', className }: PingFeedProps) {
  const hasBlocked = events.some((e) => e.kind === 'blocked');
  const now = new Date();
  return (
    <section
      className={`rounded-xl border border-line bg-s1 shadow-[var(--ele-1)] [background-image:var(--wash)] transition-[box-shadow] duration-[240ms] ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)]${
        className ? ` ${className}` : ''
      }`}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <header className="flex items-center gap-2 border-b border-line2 px-4 py-3">
        <h2 className="m-0 text-[12px] font-bold uppercase tracking-[2.4px] text-ink">{title}</h2>
        {hasBlocked && (
          <span
            className="ml-auto inline-flex items-center gap-1.5 rounded-pill bg-st-fail/10 px-2 py-0.5 text-label font-bold text-st-fail"
            role="status"
          >
            <span aria-hidden="true" className="size-1.5 animate-[bp-pulse-soft_1.6s_ease-in-out_infinite] rounded-pill bg-st-fail" />
            blocked
          </span>
        )}
      </header>
      <ol className="m-0 list-none p-0">
        {events.map((e, i) => {
          const meta = KIND_META[e.kind];
          return (
            <li key={`${e.actor}-${i}`} className="flex items-start gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className="mt-1 grid size-6 shrink-0 place-items-center rounded-pill border-2"
                style={{ borderColor: meta.color }}
              >
                <span className="size-2 rounded-pill" style={{ background: meta.color }} />
              </span>
              <div className="min-w-0 flex-1 animate-[bp-fade-in_var(--motion-base)_var(--ease-smooth)_backwards]" style={{ animationDelay: `${i * 30}ms` }}>
                <p className="m-0 flex flex-wrap items-center gap-2 text-body text-ink">
                  <Avatar size={20}>{e.actor.slice(0, 2)}</Avatar>
                  <span className="font-semibold">{e.actor}</span>
                  <span aria-hidden="true" className="text-ink3" style={{ color: meta.color }}>
                    <Icon name={meta.icon as never} size={12} />
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[1.5px] text-ink3">{meta.label}</span>
                </p>
                <div className="mt-0.5 text-body text-ink2">{e.text}</div>
              </div>
              <time className="shrink-0 text-meta text-ink3" dateTime={typeof e.at === 'string' ? e.at : e.at.toISOString()}>
                {relTime(e.at, now)}
              </time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
