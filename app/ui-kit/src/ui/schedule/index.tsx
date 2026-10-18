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
  className?: string;
}

/* Override CSS mặc định FullCalendar cho ngày tháng LÂN CẬN (adjacent month):
 * FC đặt opacity 0.3 trên .fc-daygrid-day-top → số ngày composite ra ~#c5c5c5
 * trên nền canvas → fail axe color-contrast 1.58:1 (batch ⑪ 2026-10-18).
 * Reset opacity trên ĐÚNG element (day-top) + token ink2 cho số ngày —
 * inject MODULE LOAD, specificity .bp-schedule.fc (0,4,0) thắng rule .fc (0,3,0). */
const FC_A11Y_CSS =
  '.bp-schedule.fc .fc-day-other{opacity:1}.bp-schedule.fc .fc-day-other .fc-daygrid-day-top{opacity:1}.bp-schedule.fc .fc-day-other .fc-daygrid-day-number{color:var(--ink2,#595959)}';
if (typeof document !== 'undefined' && !document.querySelector('style[data-bp-fc-a11y]')) {
  const style = document.createElement('style');
  style.setAttribute('data-bp-fc-a11y', '');
  style.textContent = FC_A11Y_CSS;
  document.head.appendChild(style);
}

export function Schedule({ events = [], onEventClick, fallback, className }: ScheduleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false; let calendar: { destroy(): void } | null = null;
    (async () => {
      try {
        const [{ Calendar }, dayGridPlugin, interactionPlugin] = await Promise.all([
                    // @ts-ignore — peer-dep lazy
          import('@fullcalendar/core'),
                    // @ts-ignore — peer-dep lazy
          import('@fullcalendar/daygrid'),
                    // @ts-ignore — peer-dep lazy
          import('@fullcalendar/interaction'),
        ]);
        if (cancelled || !ref.current) return;
        calendar = new Calendar(ref.current, {
          plugins: [dayGridPlugin.default, interactionPlugin.default],
          initialView: 'dayGridMonth',
          events: events.map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end })),
          eventClick: (info) => onEventClick?.(info.event.id),
          height: 'auto',
        });
        calendar.render();
        setLoaded(true);
      } catch {
        setFailed(true);
        console.warn('[ui-kit] @fullcalendar/* chưa cài');
      }
    })();
    return () => { cancelled = true; calendar?.destroy(); };
  }, [events, onEventClick]);

  if (failed) return <>{fallback ?? <p className="p-4 text-body text-ink3">Cài @fullcalendar/core @fullcalendar/daygrid @fullcalendar/interaction để dùng Schedule.</p>}</>;
  return <div ref={ref} className={`bp-schedule${className ? ` ${className}` : ''}`} />;
}
