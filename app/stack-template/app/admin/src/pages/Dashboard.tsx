// Dashboard — MỘT THỂ THỐNG NHẤT (vision-audit coordinator 2026-10-18).
// ANCHOR = chart card: Card (bg-s2 + border-line + rounded-xl + body p-6, header
// title + extra phải). Mọi khối theo anchor đó:
// - Stat cards: cùng Card, nội dung icon size-10 (accent/10) + label text-ink2 +
//   số text-2xl font-semibold + delta pill nhỏ thống nhất (không Statistic/Tag rời rạc)
// - Nhịp dọc: MỘT scale gap-6 giữa mọi hàng (hết mt-4/mt-6 lẫn lộn)
// - Cột phải: Timeline + EmptyState stacked flex-1 — hai card CAO ĐỀU
// - Headers: chart + timeline cùng pattern title trái + Tag phải
// Grid responsive 1/2/4 cột stats; chart 3/5 + phải 2/5 trên xl.
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Chart, Col, EmptyState, Icon, Row, Tag, Timeline, message } from '@wakii/ui-kit';

const STATS = [
  { title: 'Người dùng', value: '1.284', tag: '+12%', icon: 'users' as const },
  { title: 'Tasks đang mở', value: '316', tag: '+5%', icon: 'check-circle' as const },
  { title: 'File upload', value: '89', tag: '+23%', icon: 'upload' as const },
  { title: 'Uptime', value: '99,98%', tag: 'SLA', icon: 'info-circle' as const },
];

// Shape FLAT chuẩn kit (labels/datasets top-level — Chart component wrap `data`
// khi đẩy vào chart.js; fix 2026-10-24: component giờ hiểu cả flat lẫn nested,
// consumer chuẩn hoá về flat theo type khai báo — hết cast `as unknown`).
const CHART_CONFIG_BASE = {
  type: 'line' as const,
  labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  datasets: [
    {
      label: 'Tasks',
      data: [12, 19, 8, 22, 30, 25, 18],
      tension: 0.35,
      fill: true,
    },
    {
      label: 'Uploads',
      data: [4, 7, 3, 9, 12, 8, 6],
      tension: 0.35,
      fill: true,
    },
  ],
  // animation:false — render đồng bộ lúc constructor, không phụ thuộc rAF (headless/tab
  // background vẫn vẽ đúng frame đầu)
  options: { responsive: true, maintainAspectRatio: false, animation: false },
};

// Màu chart — probe token theo theme scope (port pattern app/ui-kit/src/templates/
// dashboard.stories.tsx: canvas không hiểu var(--), đọc computed style qua span ẩn,
// fallback hex y nguyên template). Bổ sung MutationObserver trên <html data-bp-theme>:
// AdminLayout toggle dark KHÔNG remount trang — đổi theme là chart re-resolve ngay.
const FALLBACK_COLORS = { accent: '#1677ff', done: '#52c41a' };

function useChartColors() {
  const probeRef = useRef<HTMLSpanElement>(null);
  const [colors, setColors] = useState(FALLBACK_COLORS);
  useLayoutEffect(() => {
    const read = () => {
      const cs = probeRef.current ? getComputedStyle(probeRef.current) : null;
      if (!cs) return;
      setColors({
        accent: cs.getPropertyValue('--accent').trim() || FALLBACK_COLORS.accent,
        done: cs.getPropertyValue('--st-done').trim() || FALLBACK_COLORS.done,
      });
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bp-theme'] });
    return () => observer.disconnect();
  }, []);
  return { probeRef, colors };
}

const HAS_CHART_DATA = CHART_CONFIG_BASE.datasets.some((dataset) => dataset.data.length > 0);

export function Dashboard() {
  // Màu chart theo theme — probe + re-resolve khi dark toggle (xem useChartColors)
  const { probeRef, colors } = useChartColors();
  // Dataset màu theo token theme (probe span ẩn + MutationObserver dark toggle)
  const CHART_CONFIG = useMemo(
    () => ({
      ...CHART_CONFIG_BASE,
      datasets: CHART_CONFIG_BASE.datasets.map((ds, i) => {
        const color = i === 0 ? colors.accent : colors.done;
        // Fill giữ alpha 12% như bản cũ — color-mix trên token (canvas không support
        // color-mix thì chỉ bỏ fill, line vẫn vẽ đúng màu token)
        return { ...ds, borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` };
      }),
    }),
    [colors],
  );
  return (
    <div className="flex flex-col gap-6">
      {/* Probe đọc token trong đúng theme scope (dark toggle cascade tới đây) */}
      <span ref={probeRef} aria-hidden="true" className="hidden" />
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-h1 font-semibold text-ink">Dashboard</h1>
        <Button icon={<Icon name="refresh" size={12} />}>Làm mới</Button>
      </div>

      {/* 4 stat cards — cùng anchor Card; icon + label + số + delta pill đồng bộ.
          Grid KPI rows qua Row/Col (24-col: 1 cột mobile / 2 cột ≥sm / 4 cột ≥xl). */}
      <Row gutter={[24, 24]}>
        {STATS.map((stat) => (
          <Col key={stat.title} xs={24} sm={12} xl={6}>
            <Card hoverable className="h-full">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"
                >
                  <Icon name={stat.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-body text-ink2">{stat.title}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-2xl font-semibold leading-tight text-ink">{stat.value}</span>
                    <span className="rounded-pill bg-st-done/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-st-done">
                      {stat.tag}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart (3/5 trái) + cột phải 2/5: Timeline trên + EmptyState dưới — flex-1
          mỗi card = CAO ĐỀU (grid rows fr/fr tương đương) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card title="Hoạt động 7 ngày" extra={<Tag>Tuần này</Tag>} className="xl:col-span-3">
          {HAS_CHART_DATA ? (
            <div className="h-64">
              <Chart config={CHART_CONFIG} height={256} />
            </div>
          ) : (
            <EmptyState title="Chưa có dữ liệu" description="Chưa có hoạt động nào trong 7 ngày qua." />
          )}
        </Card>
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Timeline hoạt động" extra={<Tag>real-time</Tag>} className="flex-1">
            <Timeline
              items={[
                {
                  key: 't1',
                  children: 'Alice Nguyen tạo task "Sửa bug login"',
                  label: '10 phút trước',
                },
                {
                  key: 't2',
                  color: 'var(--st-done)',
                  children: 'Bot sync Kafka — 24 events đã xử lý',
                  label: '1 giờ trước',
                },
                {
                  key: 't3',
                  children: 'Bob Tran upload 3 file vào "Báo cáo Q4"',
                  label: '3 giờ trước',
                },
                {
                  key: 't4',
                  color: 'var(--st-fail)',
                  children: 'Saga gán task thất bại — DLQ có message mới',
                  label: 'Hôm qua',
                },
              ]}
            />
          </Card>
          <Card className="flex-1">
            <EmptyState
              title="Chưa có báo cáo tuần"
              description="Báo cáo sẽ tự sinh vào mỗi sáng thứ Hai, hoặc tạo ngay bây giờ."
              action={
                <Button type="primary" onClick={() => message.info('Tạo báo cáo (demo)')}>
                  Tạo báo cáo
                </Button>
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
