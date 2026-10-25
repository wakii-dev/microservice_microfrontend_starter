// Overlay EXTRA: schedule — trang demo <Schedule> qua subpath '@wakii/ui-kit/schedule'.
// ⚠️ PEER DEPS: "@fullcalendar/core" + "@fullcalendar/daygrid" + "@fullcalendar/interaction"
// (kit lazy-import cả 3; thiếu → fallback message, không crash).
// Redesign v2 2026-10-25: lịch full-width cho cell rộng + "Up next" hàng ngang
// dưới lịch (dot màu token), bỏ card giải thích thừa — layout 1 cột cân đối.
import { Card, Tag, Text, Title } from '@wakii/ui-kit';
import { Schedule, type ScheduleEvent } from '@wakii/ui-kit/schedule';

const EYEBROW = 'text-label font-semibold uppercase tracking-[0.1em] text-accent';

/** ISO date offset từ hôm nay — demo không bị lỗi thời. */
function iso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const EVENTS: ScheduleEvent[] = [
  { id: 'kickoff', title: 'Project kickoff', start: iso(-4), end: iso(-3) },
  { id: 'standup-1', title: 'Standup', start: iso(0) },
  { id: 'design-review', title: 'Design review', start: iso(2) },
  { id: 'one-on-one', title: '1:1 — design', start: iso(4) },
  { id: 'usability-test', title: 'Usability test', start: iso(6) },
  { id: 'release', title: 'Release 0.1.0', start: iso(8) },
  { id: 'retro', title: 'Sprint retro', start: iso(10) },
  { id: 'hack-day', title: 'Hack day', start: iso(12) },
  { id: 'deploy-freeze', title: 'Deploy freeze', start: iso(14) },
];

const UPCOMING = EVENTS.filter((e) => new Date(e.start).getTime() >= Date.now() - 864e5).slice(0, 5);

const DOT: Record<string, string> = {
  release: 'bg-st-done',
  'deploy-freeze': 'bg-st-fail',
};

/** Route gợi ý cho engine: '/schedule'. */
export function ScheduleDemo() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <span className={EYEBROW}>Extra · fullcalendar</span>
        <Title level={1}>Schedule the month</Title>
        <div className="max-w-2xl">
          <Text type="secondary">
            FullCalendar month grid wrapped by the kit — events are plain{' '}
            <Text code>{`{ id, title, start, end? }`}</Text> records, multi-day spans just work. Click an event to
            see its id in the console.
          </Text>
        </div>
      </div>

      <Card extra={<Tag>{EVENTS.length} events</Tag>}>
        <Schedule events={EVENTS} height={520} onEventClick={(id) => console.log('event clicked:', id)} />
      </Card>

      {/* Up next — hàng ngang, dot màu theo token trạng thái */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Text strong>Up next</Text>
          <Text type="secondary">next {UPCOMING.length} events</Text>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {UPCOMING.map((e) => (
            <div key={e.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-s1 px-4 py-3">
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-pill ${DOT[e.id] ?? 'bg-accent'}`} />
              <span className="flex min-w-0 flex-col">
                <Text strong>{e.title}</Text>
                <Text type="secondary">{shortDate(e.start)}</Text>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
