// @ts-nocheck — peer-dep lazy import (engine optional, consumer tự cài — runtime try/catch)
// Schedule — PEER-DEP pattern: FullCalendar lazy import.
// Cài: pnpm add @fullcalendar/core @fullcalendar/daygrid @fullcalendar/interaction
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
}

export interface ScheduleProps {
  events?: ScheduleEvent[];
  onEventClick?: (eventId: string) => void;
  /** Fallback khi FullCalendar chưa cài. */
  fallback?: ReactNode;
  /** Chiều cao cố định px — ổn định giữa tháng 5/6 hàng (default 650; 'auto' = theo nội dung). */
  height?: number | 'auto';
  className?: string;
}

/* Override CSS mặc định FullCalendar cho ngày tháng LÂN CẬN (adjacent month):
 * FC đặt opacity 0.3 trên .fc-daygrid-day-top → số ngày composite ra ~#c5c5c5
 * trên nền canvas → fail axe color-contrast 1.58:1 (batch ⑪ 2026-10-18).
 * Reset opacity trên ĐÚNG element (day-top) + token ink2 cho số ngày —
 * inject MODULE LOAD, specificity .bp-schedule.fc (0,4,0) thắng rule .fc (0,3,0). */
const FC_A11Y_CSS =
  '.bp-schedule.fc .fc-day-other{opacity:1}.bp-schedule.fc .fc-day-other .fc-daygrid-day-top{opacity:1}.bp-schedule.fc .fc-day-other .fc-daygrid-day-number{color:var(--ink2,#595959)}';

/* Toolbar + frame skin (backlog polish 2026-10-18 — "FC toolbar skin theo tokens"):
 * - Nút prev/next/today/view = Button pattern NHỎ (h-8/px-3): bg-s2 + border-line +
 *   rounded-lg, hover bg-s3, active view = accent, focus ring accent/40, disabled
 *   bg-disabled/ink4.
 * - Title = text-h3 (token --fs-h3 15px, coordinator chỉ định) weight 600.
 * - Frame: header bg-s2 + border-line qua FC CSS vars (--fc-page-bg-color/
 *   --fc-border-color) — mọi border FC ăn token, dark theme tự theo.
 * Specificity .bp-schedule.fc (≥0,4,0) thắng rule .fc (0,2–3,0), inject sau FC CSS. */
const FC_SKIN_CSS = [
  '.bp-schedule.fc{--fc-page-bg-color:var(--c-s2);--fc-border-color:var(--line);--fc-neutral-bg-color:var(--c-s3);--fc-today-bg-color:color-mix(in srgb,var(--accent) 8%,transparent);border:1px solid var(--line);border-radius:var(--r-3);background:var(--c-s2)}',
  '.bp-schedule.fc .fc-toolbar.fc-header-toolbar{flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem;padding:.75rem;border-bottom:1px solid var(--line2)}',
  '.bp-schedule.fc .fc-toolbar-title{font-size:var(--fs-h3,15px);font-weight:600;color:var(--ink)}',
  '.bp-schedule.fc .fc-button{height:2rem;padding:0 .75rem;background:var(--c-s2);border:1px solid var(--line);border-radius:var(--r-2);color:var(--ink);font-size:var(--fs-label,13px);font-weight:400;box-shadow:none;text-transform:none}',
  '.bp-schedule.fc .fc-button:hover{background:var(--c-s3);border-color:var(--line2);color:var(--ink)}',
  '.bp-schedule.fc .fc-button:not(:disabled).fc-button-active,.bp-schedule.fc .fc-button:not(:disabled):active{background:var(--accent);border-color:var(--accent);color:#fff}',
  '.bp-schedule.fc .fc-button:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 40%,transparent)}',
  '.bp-schedule.fc .fc-button:disabled{background:var(--bg-disabled);border-color:var(--line);color:var(--ink4)}',
].join('');
if (typeof document !== 'undefined' && !document.querySelector('style[data-bp-fc-a11y]')) {
  const style = document.createElement('style');
  style.setAttribute('data-bp-fc-a11y', '');
  style.textContent = FC_A11Y_CSS + FC_SKIN_CSS;
  document.head.appendChild(style);
}

export function Schedule({ events = [], onEventClick, fallback, height = 650, className }: ScheduleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false; let calendar: { destroy(): void } | null = null;
    (async () => {
      try {
        // Lazy peer-dep imports — @ts-nocheck đầu file lo phần type (deps tuỳ consumer)
        const [{ Calendar }, dayGridPlugin, interactionPlugin] = await Promise.all([
          import('@fullcalendar/core'),
          import('@fullcalendar/daygrid'),
          import('@fullcalendar/interaction'),
        ]);
        if (cancelled || !ref.current) return;
        calendar = new Calendar(ref.current, {
          plugins: [dayGridPlugin.default, interactionPlugin.default],
          initialView: 'dayGridMonth',
          events: events.map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end })),
          eventClick: (info) => onEventClick?.(info.event.id),
          // Height cố định (default 650) — tháng 5/6 hàng giữ nguyên khung, không nhảy layout
          height,
        });
        calendar.render();
      } catch {
        setFailed(true);
        console.warn('[ui-kit] @fullcalendar/* chưa cài');
      }
    })();
    return () => { cancelled = true; calendar?.destroy(); };
  }, [events, onEventClick, height]);

  if (failed) return <>{fallback ?? <p className="p-4 text-body text-ink3">Cài @fullcalendar/core @fullcalendar/daygrid @fullcalendar/interaction để dùng Schedule.</p>}</>;
  return <div ref={ref} className={`bp-schedule${className ? ` ${className}` : ''}`} />;
}
