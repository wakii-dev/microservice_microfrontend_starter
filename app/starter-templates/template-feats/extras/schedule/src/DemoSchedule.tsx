// Overlay EXTRA: schedule — trang demo <Schedule> qua subpath '@wakii/ui-kit/schedule'
// (engine thêm route '/schedule' + chèn deps bên dưới).
// ⚠️ PEER DEPS — CLI thêm vào dependencies khi chọn extra này (THỨ TỰ như kit
// ui/schedule/source chỉ dẫn — đủ 3 package):
//   "@fullcalendar/core": "^6.1.15",
//   "@fullcalendar/daygrid": "^6.1.15",
//   "@fullcalendar/interaction": "^6.1.15"
// Schedule lazy-import cả 3 lúc runtime; thiếu → fallback message trong page.
import { Schedule, type ScheduleEvent } from '@wakii/ui-kit/schedule';
import { Text, Title } from '@wakii/ui-kit';

/** ISO date offset từ hôm nay — demo không bị lỗi thời. */
function iso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const EVENTS: ScheduleEvent[] = [
  { id: 'kickoff', title: 'Project kickoff', start: iso(1), end: iso(2) },
  { id: 'design-review', title: 'Design review', start: iso(3) },
  { id: 'release', title: 'Release 0.1.0', start: iso(7) },
];

/** Route gợi ý cho engine: '/schedule'. */
export function ScheduleDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Title level={2}>Schedule</Title>
      <Text type="secondary">
        FullCalendar month grid wrapped by the kit — click an event to log it; theme follows light/dark.
      </Text>
      <Schedule events={EVENTS} height={560} onEventClick={(id) => console.log('event clicked:', id)} />
    </div>
  );
}
