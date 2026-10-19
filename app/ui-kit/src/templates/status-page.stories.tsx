// Templates/Status Page — chuẩn statuspage.io (R11, template 12/12) — UI/UX pass V1:
// hero brand + overall-status banner xanh to (EmptyState khi all-operational) +
// uptime CountUp 64px/300 tabular (REF-SPECT stat to đúng khối) · Alert incident
// filled có icon nổi bật · service Cards: tên đậm + Badge status + latency mono +
// uptime-bar 90 ngày (mini bars kiểu statuspage) · Chart latency 340px có grid +
// legend · nhịp section mt-8/mt-12 · subscribe 1 hàng gọn · Timeline lịch sử.
// REF-SPEC: label 12px/700 tracking 2.4 · stat label 11px/700 2.64 · H2 29px/300.
import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { z } from 'zod';
import {
  Alert, Button, Card, Chart, type ChartConfig, CountUp, Field, Icon,
  Input, message, Segmented, Switch, Timeline, Tooltip,
} from '../index';

// ── Data Orca-flavored — hạ tầng boilerplate 10 services ──
type ServiceState = 'operational' | 'degraded';
interface Service { name: string; meta: string; uptime: number; latency: string; state: ServiceState }
const SERVICES_BASE: Service[] = [
  { name: 'Gateway', meta: 'nginx :8080', uptime: 99.99, latency: '38 ms', state: 'operational' },
  { name: 'Tasks API', meta: 'node-svc :3001', uptime: 99.98, latency: '124 ms', state: 'operational' },
  { name: 'Activity API', meta: 'go-svc :8082', uptime: 99.97, latency: '96 ms', state: 'operational' },
  { name: 'Auth', meta: 'auth-svc :8090', uptime: 100, latency: '52 ms', state: 'operational' },
  { name: 'Kafka', meta: 'task-events topics', uptime: 99.95, latency: '—', state: 'operational' },
  { name: 'Postgres', meta: 'pg 5432', uptime: 99.99, latency: '11 ms', state: 'operational' },
  { name: 'Admin', meta: 'app/admin', uptime: 99.82, latency: '610 ms', state: 'degraded' },
  { name: 'Docs', meta: 'walkthrough + recipes', uptime: 99.99, latency: '44 ms', state: 'operational' },
];

/** Uptime bar 90 ngày (thu gọn 45 cột) — deterministic theo tên service. */
function uptimeBars(s: Service, degradedSim: boolean): Array<'ok' | 'slow'> {
  const bars: Array<'ok' | 'slow'> = [];
  for (let i = 0; i < 45; i++) {
    const wobble = (s.name.charCodeAt(0) + i * 7) % 11 === 0;
    bars.push(wobble ? 'slow' : 'ok');
  }
  if (degradedSim && s.state === 'degraded') for (let i = 40; i < 45; i++) bars[i] = 'slow';
  return bars;
}

const SECTION_LABEL = 'm-0 text-[12px] font-bold tracking-[2.4px] text-ink3 uppercase';
const mailSchema = z.object({ email: z.string().email('Email không hợp lệ') });

function StatusPage() {
  const [degradedSim, setDegradedSim] = useState(true);
  const [period, setPeriod] = useState('30');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();

  const services = useMemo(
    () => SERVICES_BASE.map((s) => (
      degradedSim && s.name === 'Admin' ? { ...s, state: 'degraded' as const, uptime: 99.82 } : s
    )),
    [degradedSim],
  );
  const degradedCount = services.filter((s) => s.state === 'degraded').length;
  const allOk = degradedCount === 0;

  // Chart latency — đổi theo Segmented period (live); grid + legend như statuspage
  const latencyConfig = useMemo<ChartConfig>(() => {
    const days = Number(period);
    const make = (base: number, jitter: number, seed: number) =>
      Array.from({ length: days }, (_, i) => Math.round((base + Math.sin((i + seed) / 3) * jitter) * 10) / 10);
    const labels = Array.from({ length: days }, (_, i) => (days > 10 && i % 5 !== 0 ? '' : `D-${days - 1 - i}`));
    return {
      type: 'line',
      labels,
      datasets: [
        { label: 'p50 (ms)', data: make(120, 18, 1), borderColor: '#1677ff', backgroundColor: '#1677ff', borderWidth: 2, tension: 0.35 },
        { label: 'p99 (ms)', data: make(340, 60, 4), borderColor: '#52c41a', backgroundColor: '#52c41a', borderWidth: 2, tension: 0.35 },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        elements: { point: { radius: days > 10 ? 0 : 3 } },
        plugins: { legend: { position: 'top', labels: { boxWidth: 10, usePointStyle: true } } },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(128, 138, 152, 0.18)' },
            border: { display: false },
          },
        },
      },
    };
  }, [period]);

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const parsed = mailSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message);
      return;
    }
    setEmailError(undefined);
    message.success(`Đã đăng ký cập nhật cho ${parsed.data.email}.`);
    setEmail('');
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* §1 Header brand — statuspage.io: logo + tên page */}
        <header className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-accent text-white">
            <Icon name="heart" size={18} />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-h3 font-semibold text-ink">Wakii Status</p>
            <p className="m-0 font-mono text-[11px] font-bold tracking-[2.64px] text-ink3 uppercase">Orca boilerplate</p>
          </div>
          <span className="ml-auto font-mono text-[11px] font-bold tracking-[2.64px] text-ink3 uppercase">status.wakii.dev</span>
        </header>

        {/* §2 Overall banner — all-operational: EmptyState xanh to (statuspage signature);
            degraded: Alert filled có icon nổi bật ngay dưới hero */}
        <div className="mt-8">
          {allOk ? (
            <div className="flex items-center gap-4 rounded-xl border border-st-done/25 bg-st-done/8 p-5" role="status">
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-pill bg-st-done/15 text-st-done">
                <Icon name="check-circle" size={26} />
              </span>
              <div>
                <p className="m-0 text-[29px] font-light leading-snug text-st-done">All Systems Operational</p>
                <p className="m-0 text-[12px] tracking-[0.3px] text-ink2">Toàn bộ 8 service hoạt động trong ngưỡng SLA — cập nhật liên tục.</p>
              </div>
            </div>
          ) : (
            <Alert
              type="warning"
              message="Đang điều tra — Admin console chậm"
              description="p99 latency tăng cục bộ từ 21:04. Gateway + API vẫn ổn; chúng tôi đang theo dõi Kafka consumer lag. Cập nhật tiếp theo trong 30 phút."
            />
          )}
        </div>

        {/* §3 Hero uptime — CountUp to đúng khối (64px/300 tabular) + simulate toggle */}
        <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="m-0 text-[11px] font-bold tracking-[2.64px] text-ink3 uppercase">Uptime — 90 ngày qua</p>
            <p className="m-0 flex items-baseline gap-1">
              <CountUp
                value={allOk ? 99.99 : 99.86}
                decimals={2}
                duration={1.8}
                format={(n) => n.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                className="text-[64px] font-light leading-none tracking-tight text-ink"
              />
              <span className="text-2xl font-light text-ink3">%</span>
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] font-bold tracking-[2.4px] text-ink3 uppercase">
            Simulate degraded
            <Switch checked={degradedSim} onChange={setDegradedSim} aria-label="Mô phỏng service degraded" />
          </label>
        </div>

        {/* §4 Service grid — Card: tên đậm + Badge phải + latency mono + uptime bars 90d */}
        <div className="mt-12">
          <p className={SECTION_LABEL}>Services — 8 hệ thống</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const bars = uptimeBars(s, degradedSim);
              return (
                <Tooltip key={s.name} title={`${s.meta} — uptime 90 ngày: ${s.uptime}%`} placement="top">
                  <Card className="cursor-default">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 rounded-pill ${s.state === 'operational' ? 'bg-st-done' : 'bg-st-doing'}`}
                      />
                      <p className="m-0 min-w-0 flex-1 truncate font-semibold text-ink">{s.name}</p>
                      <span className="shrink-0 font-mono text-label tabular-nums text-ink2">{s.latency}</span>
                      <span
                        className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-[1.5px] ${
                          s.state === 'operational' ? 'bg-st-done/10 text-st-done' : 'bg-st-doing/10 text-st-doing'
                        }`}
                      >
                        {s.state === 'operational' ? 'Operational' : 'Degraded'}
                      </span>
                    </div>
                    {/* 90-day uptime bars — signature statuspage.io */}
                    <div className="mt-3 flex h-6 items-stretch gap-[2px]" aria-hidden="true">
                      {bars.map((b, i) => (
                        <span key={i} className={`min-w-0 flex-1 rounded-[1px] ${b === 'ok' ? 'bg-st-done/70' : 'bg-st-doing'}`} />
                      ))}
                    </div>
                    <p className="m-0 mt-1.5 flex justify-between text-meta text-ink3">
                      <span>90 ngày trước</span>
                      <span className="font-mono tabular-nums">{s.uptime}% uptime</span>
                    </p>
                  </Card>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* §5 Chart latency — to (340px) + grid line + legend; Segmented đổi live */}
        <div className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={SECTION_LABEL}>API latency — ms</p>
            <Segmented
              value={period}
              onChange={(v) => setPeriod(String(v))}
              options={[
                { label: '7 ngày', value: '7' },
                { label: '30 ngày', value: '30' },
                { label: '90 ngày', value: '90' },
              ]}
            />
          </div>
          <Card className="mt-4">
            <Chart config={latencyConfig} height={340} />
          </Card>
        </div>

        {/* §6 Timeline lịch sử sự cố */}
        <div className="mt-12">
          <p className={SECTION_LABEL}>Lịch sử sự cố — 90 ngày qua</p>
          <Card className="mt-4">
            <Timeline
              items={[
                { key: 'i3', children: 'Không có sự cố — uptime 100% trong 9 ngày gần nhất', label: 'Hôm nay' },
                {
                  key: 'i2', color: 'var(--st-doing)',
                  children: (
                    <span>
                      <span className="font-medium text-ink">Degraded — Kafka consumer lag</span> — consumer reset, không mất event. Kéo dài 42 phút.
                    </span>
                  ),
                  label: '12 Oct',
                },
                {
                  key: 'i1', color: 'var(--st-fail)',
                  children: (
                    <span>
                      <span className="font-medium text-ink">Outage — Postgres failover</span> — ghi bị chặn 8 phút trong failover tự động; đọc không ảnh hưởng.
                    </span>
                  ),
                  label: '28 Sep',
                },
              ]}
            />
          </Card>
        </div>

        {/* §7 Subscribe — 1 hàng gọn: email + nút, meta người đăng ký */}
        <div className="mt-12 rounded-xl border border-line bg-s1 p-4">
          <form className="flex flex-wrap items-start gap-3" onSubmit={subscribe} noValidate>
            <div className="min-w-0 flex-1">
              <Field label="Nhận cập nhật sự cố" htmlFor="status-email" error={emailError} hint="Chỉ gửi khi có incident — không spam.">
                <Input
                  id="status-email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  invalid={!!emailError}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>
            <Button type="primary" className="mt-6 whitespace-nowrap" onClick={() => {
              const parsed = mailSchema.safeParse({ email: email.trim() });
              if (!parsed.success) {
                setEmailError(parsed.error.issues[0]?.message);
                return;
              }
              message.success(`Đã đăng ký cập nhật cho ${parsed.data.email}.`);
              setEmail('');
            }}>
              Subscribe
            </Button>
          </form>
          <p className="m-0 mt-3 flex items-center gap-2 text-meta text-ink3">
            <span className="flex -space-x-1.5">
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-pill border border-canvas bg-s3 text-[9px] font-bold text-ink2">A</span>
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-pill border border-canvas bg-s3 text-[9px] font-bold text-ink2">B</span>
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-pill border border-canvas bg-s3 text-[9px] font-bold text-ink2">C</span>
            </span>
            +128 người đã đăng ký nhận cảnh báo.
          </p>
        </div>

        {/* §8 Footer meta */}
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line2 pt-4">
          <p className="m-0 text-meta text-ink3">Cập nhật lúc 21:30 ICT · Dữ liệu demo Orca boilerplate</p>
          <span className="font-mono text-[11px] font-bold tracking-[2.64px] text-ink3 uppercase">status.wakii.dev</span>
        </footer>
      </div>
    </div>
  );
}

const meta = { title: 'Templates/Status Page', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

/** StatusPage — light: statuspage.io layout với live degraded-toggle + latency chart. */
export const Light: S = {
  render: () => <StatusPage />,
};

/** DarkTheme — cùng trang dưới `data-bp-theme="dark"`: tokens cascade. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="min-h-screen bg-canvas">
      <StatusPage />
    </div>
  ),
};
