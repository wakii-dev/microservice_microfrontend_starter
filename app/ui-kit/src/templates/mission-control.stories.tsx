// Templates/Mission Control — bảng điều khiển on-call ghép 100% ui-kit (R11):
// Toolbar (Segmented ưu tiên + Search) lọc timeline · Statistic band CountUp ·
// Kanban 3 cột WIP triage sự cố · Timesheet tuần log giờ on-call · Timeline sự cố ·
// Alert trạng thái TỰ ĐỔI theo vị trí card trên board (investigating → warning,
// hết card đang xử lý → success). Data Orca-flavored (Kafka/outbox/DLQ/saga).
// REF-SPEC typography: label mono 11px/700 uppercase tracking 2.64 · H2 29px/300 ·
// body 12px/400 tracking 0.3. reduced-motion: motion family tự tắt.
import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Alert,
  Card,
  CountUp,
  Input,
  KanbanBoard,
  type KanbanColumnData,
  Reveal,
  Segmented,
  Statistic,
  Tag,
  Timeline,
  Timesheet,
  type TimesheetRow,
} from '../index';

const meta = { title: 'Templates/Mission Control', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// ── Data Orca-flavored ──

type Sev = 'sev1' | 'sev2' | 'sev3';

interface Incident {
  key: string;
  title: string;
  sev: Sev;
  service: string;
}

const SEV_TAG: Record<Sev, { label: string; color: string }> = {
  sev1: { label: 'SEV1', color: '#ff4d4f' },
  sev2: { label: 'SEV2', color: '#faad14' },
  sev3: { label: 'SEV3', color: '#52c41a' },
};

const INCIDENTS: Incident[] = [
  { key: 'inc-1', title: 'Kafka consumer lag > 10k', sev: 'sev1', service: 'go-svc' },
  { key: 'inc-2', title: 'Outbox retry spike', sev: 'sev2', service: 'node-svc' },
  { key: 'inc-3', title: 'DLQ có 3 message mới', sev: 'sev2', service: 'go-svc' },
  { key: 'inc-4', title: 'Saga gán task timeout', sev: 'sev3', service: 'node-svc' },
  { key: 'inc-5', title: 'p99 API tasks > 800ms', sev: 'sev3', service: 'gateway' },
];

const BOARD: KanbanColumnData[] = [
  { key: 'backlog', title: 'Backlog', wipLimit: 4, cards: INCIDENTS.slice(3).map((i) => ({ key: i.key, title: i.title, tag: i.service })) },
  { key: 'investigating', title: 'Đang xử lý', wipLimit: 2, cards: INCIDENTS.slice(0, 2).map((i) => ({ key: i.key, title: i.title, tag: i.service })) },
  { key: 'mitigated', title: 'Đã giảm thiểu', cards: [] },
];

const WEEK: TimesheetRow[] = [
  { key: 'oncall-primary', label: 'On-call chính', meta: 'Alice — tuần này', values: [6, 7, 4, 8, 5, 2, null] },
  { key: 'oncall-shadow', label: 'On-call hộ', meta: 'Hội — shadow', values: [2, 1, 3, null, 4, 1, null] },
  { key: 'postmortem', label: 'Postmortem INC-1042', meta: 'viết RCA', values: [3, 2, 2, 1, null, null, null] },
];

const TIMELINE = [
  { time: '21:42', tag: 'go-svc', text: 'Consumer lag về 200 — bắt đầu replay DLQ', color: 'var(--st-done)' },
  { time: '21:07', tag: 'node-svc', text: 'Outbox retry spike 412/min — tăng worker 2→6', color: 'var(--st-doing)' },
  { time: '20:55', tag: 'gateway', text: 'p99 tasks 812ms — phát hiện N+1 query assignee', color: 'var(--st-fail)' },
  { time: '20:31', tag: 'node-svc', text: 'Saga gán task timeout — bôi đỏ task #108, vào DLQ', color: 'var(--st-fail)' },
];

// ── Trang ghép ──

function MissionControlPage() {
  const [columns, setColumns] = useState<KanbanColumnData[]>(BOARD);
  const [segment, setSegment] = useState('all');
  const [search, setSearch] = useState('');
  const [week, setWeek] = useState(new Date(2026, 9, 19)); // Thứ 2 19/10/2026

  // Alert TỰ ĐỔI theo state board: còn card đang xử lý → warning; trống → success.
  const investigating = columns.find((c) => c.key === 'investigating')?.cards.length ?? 0;
  const systemAlert =
    investigating > 0 ? (
      <Alert
        type="warning"
        message={`${investigating} sự cố đang xử lý — giữ WIP ≤ 2 trước khi nhận thêm`}
        description="Kéo card sang 'Đã giảm thiểu' khi mitigation xong; saga sẽ replay event từ outbox."
      />
    ) : (
      <Alert type="success" message="Tất cả hệ thống ổn định" description="Không có sự cố nào đang xử lý — WIP trống." />
    );

  // Filter timeline: segmented theo service + search theo text (R11 — filter chạy thật)
  const timelineItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TIMELINE.filter((t) => (segment === 'all' ? true : t.tag === segment)).filter((t) =>
      q ? t.text.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q) : true,
    );
  }, [segment, search]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      {/* Header + Toolbar filter (Segmented ưu tiên + Search) */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-ink3">
            Orca · Mission Control
          </p>
          <h1 className="m-0 mt-1 text-[29px] font-light tracking-[0.02em] text-ink">
            Bảng điều khiển on-call
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            ariaLabel="Lọc theo service"
            value={segment}
            onChange={setSegment}
            options={[
              { label: 'Tất cả', value: 'all' },
              { label: 'go-svc', value: 'go-svc' },
              { label: 'node-svc', value: 'node-svc' },
              { label: 'gateway', value: 'gateway' },
            ]}
          />
          <Input.Search
            aria-label="Tìm sự cố"
            placeholder="Tìm sự cố…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
        </div>
      </header>

      {/* Statistic band — CountUp chạy khi vào viewport */}
      <Reveal direction="up">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Card size="small">
            <Statistic title="Uptime 30 ngày" value={<CountUp value={99.98} decimals={2} />} suffix="%" />
          </Card>
          <Card size="small">
            <Statistic title="Sự cố tháng này" value={<CountUp value={7} />} />
          </Card>
          <Card size="small">
            <Statistic title="Deploy tuần" value={<CountUp value={42} />} />
          </Card>
          <Card size="small">
            <Statistic title="MTTR" value={<CountUp value={26} />} suffix=" phút" />
          </Card>
        </div>
      </Reveal>

      {systemAlert}

      {/* Kanban triage + Timesheet on-call */}
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card
          title="Triage sự cố — kéo thẻ để điều phối"
          extra={<Tag>WIP đang xử lý ≤ 2</Tag>}
          className="min-w-0"
        >
          <KanbanBoard
            ariaLabel="Bảng triage sự cố"
            columns={columns}
            onCardMove={(cardKey, _from, toCol) => {
              setColumns((prev) => {
                const card = prev.flatMap((c) => c.cards).find((k) => k.key === cardKey);
                return prev.map((c) => ({
                  ...c,
                  cards:
                    c.key === toCol ? [...c.cards, { key: cardKey, title: card?.title ?? cardKey, tag: card?.tag }] : c.cards.filter((k) => k.key !== cardKey),
                }));
              });
            }}
          />
        </Card>
        <Card title="Log giờ on-call — tuần này" className="min-w-0">
          <Timesheet
            rows={WEEK}
            week={week}
            editable
            onCellChange={(rowKey, dayIndex, value) => {
              // Demo: state nội bộ của Timesheet tự quản ô; log ra console cho trace
              // demo — Timesheet tự quản state ô nhập
            }}
            onWeekChange={(w) => setWeek(w)}
          />
        </Card>
      </div>

      {/* Timeline sự cố — lọc theo Segmented + Search */}
      <Card title={`Timeline sự cố (${timelineItems.length}/${TIMELINE.length})`}>
        {timelineItems.length > 0 ? (
          <Timeline
            items={timelineItems.map((t) => ({
              key: `${t.time}-${t.tag}`,
              color: t.color,
              children: (
                <span className="text-body">
                  <Tag>{t.tag}</Tag> {t.text}
                </span>
              ),
              label: t.time,
            }))}
          />
        ) : (
          <p className="m-0 text-body text-ink3">Không có sự cố khớp bộ lọc.</p>
        )}
      </Card>
    </div>
  );
}

/** Full — band CountUp + Kanban WIP + Timesheet + Timeline + Alert tự đổi. */
export const MissionControl: Story = {
  name: 'Mission control — board + timesheet + stats + timeline + alert tự đổi',
  render: () => <MissionControlPage />,
};

/** Incident response — Kanban WIP + Alert tự đổi theo state board. */
export const IncidentResponse: Story = {
  name: 'Incident response — kéo thẻ là Alert đổi trạng thái',
  render: () => <MissionControlPage />,
};

