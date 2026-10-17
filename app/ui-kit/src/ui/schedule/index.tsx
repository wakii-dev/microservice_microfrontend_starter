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

export function Schedule({ events = [], onEventClick, fallback, className }: ScheduleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false; let calendar: { destroy(): void } | null = null;
    (async () => {
      try {
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
  return <div ref={ref} className={className} />;
}
