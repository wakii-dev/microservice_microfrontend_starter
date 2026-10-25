// Intro/Showcase — trang landing THUYẾT PHỤC dùng @wakii/ui-kit (bán hàng nội
// bộ, tiếng Việt — khác stories component đang EN). 100% ghép từ component của
// chính kit: dogfooding LÀ thông điệp — trang này không có 1 dòng CSS riêng.
// Hero (Tag + Title + CTA scroll tới demo + lệnh install) · stats strip
// (Statistic + CountUp) · live demo mini (Button/Alert/CheckableTag/Switch/
// Segmented/Timeline — mọi control STATE THẬT, chạm được) · "Tại sao" grid 6
// (Reveal stagger + Card + Icon) · footer CTA mời đọc USAGE.md + Templates/*.
// Tokens-only mọi className; dark tự ăn qua data-bp-theme (toolbar Theme).
// Motion: mỗi primitive một element (Reveal viewport · CountUp state), tôn
// trọng prefers-reduced-motion (component tự tắt + CTA scroll hạ về 'auto').
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './ui/alert/index';
import { Button } from './ui/button/index';
import { Card } from './ui/card/index';
import { CountUp } from './ui/count-up/index';
import { Divider } from './ui/divider/index';
import { Icon, type IconName } from './ui/icons/index.js';
import { Reveal } from './ui/reveal/index';
import { Segmented } from './ui/segmented/index';
import { Statistic } from './ui/statistic/index';
import { Switch } from './ui/switch/index';
import { Tag } from './ui/tag/index';
import { Timeline } from './ui/timeline/index';
import { Text, Title } from './ui/typography/index';

const meta = {
  title: 'Intro/Showcase', // ASCII — storyId/URL sạch (nội dung canvas giữ tiếng Việt)
  tags: ['autodocs'],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Số liệu thật (đo tại build HEAD 267a273 + story này): 1235 tests pass (gate
// PR #56), 667 story entries trong storybook-static/index.json (type=story,
// đã gồm story này), 90+ components (CHANGELOG 0.3.0). "Deps runtime 0" =
// barrel chính (USAGE.md: heavy lib là peer-dep theo subpath — chart/schedule/
// carousel/editor + zod cho useForm; packages chỉ-list cho máy đóng gói).
const STATS: Array<{ title: string; value: number; suffix?: string; note: string }> = [
  { title: 'Components', value: 90, suffix: '+', note: '7 nhóm, taxonomy chuẩn' },
  { title: 'Tests pass', value: 1235, note: 'vitest, chạy mỗi PR' },
  { title: 'Stories', value: 667, note: 'docs sống trong Storybook' },
  { title: 'Deps runtime', value: 0, note: 'barrel chính — subpath nặng tách riêng (chart·schedule·carousel·editor = peer-dep lazy)' },
];

const REASONS: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'check-circle',
    title: 'A11y có test theo dõi',
    body: 'role/aria-* wired sẵn trên menu, dialog, switch, slider… focus ring chuẩn mọi control — regression chặn bằng test, không thanks hụt.',
  },
  {
    icon: 'settings',
    title: 'Tokens-first — 0 hex cứng',
    body: 'Màu, bo góc, độ trễ, đổ bóng đều đọc CSS var. Đổi token một nơi là cả hệ thống (và dark theme) đổi theo.',
  },
  {
    icon: 'eye',
    title: 'Dark cascade thật',
    body: 'data-bp-theme="dark" là toàn bộ component tối — không CSS riêng, không re-render. Thử ngay bằng nút Theme trên toolbar.',
  },
  {
    icon: 'clock',
    title: 'Motion GPU-only',
    body: 'Chỉ animate transform/opacity trên thang --motion-instant → slow. prefers-reduced-motion: mọi thứ rơi về tức thì.',
  },
  {
    icon: 'file',
    title: 'TypeScript strict',
    body: 'Props đầy đủ type + JSDoc, không any lách luật — autocomplete và báo lỗi compile trước khi chạy.',
  },
  {
    icon: 'copy',
    title: 'Import thẳng source',
    body: 'Consumed qua source (ADR-0009): không build step, không version drift — cần khác thì fork từng component ngay trong repo.',
  },
];

/** CTA scroll mượt tới demo — reduced-motion thì nhảy thẳng (không animation). */
function scrollToDemo() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('bp-showcase-demo')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/** Hero — Tag + Title + Text 1 câu + 2 CTA + lệnh install trong khối mono. */
function Hero() {
  return (
    <section className="flex flex-col items-center gap-5 pt-8 text-center">
      <Reveal direction="down">
        <Tag icon={<Icon name="check-circle" size={12} />}>Design system nội bộ — v0.3.0</Tag>
      </Reveal>
      <Title level={1} style={{ marginBottom: 0 }} className="max-w-2xl">
        Wakii UI Kit
      </Title>
      <Text type="secondary" className="max-w-xl text-body">
        90+ components antd-look, tokens-first, a11y-tested — consumed qua source, không build step.
      </Text>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="primary" size="large" onClick={scrollToDemo} className="whitespace-nowrap">
          Sờ thử components
        </Button>
        <Button size="large" icon={<Icon name="external-link" size={14} />} className="whitespace-nowrap">
          Xem templates
        </Button>
      </div>
      <code className="rounded-lg border border-line bg-s3 px-3 py-1.5 font-mono text-meta text-ink2">
        pnpm add @wakii/ui-kit --workspace
      </code>
    </section>
  );
}

/** Stats strip — 4 số thật, đếm ease-out bằng CountUp trong Statistic. */
function StatsStrip() {
  return (
    <section className="grid grid-cols-2 gap-6 rounded-xl border border-line bg-s1 p-6 sm:grid-cols-4">
      {STATS.map((s) => (
        <div key={s.title} className="flex flex-col">
          <Statistic title={s.title} value={<CountUp value={s.value} />} suffix={s.suffix} />
          <div className="mt-1 text-meta text-ink2">{s.note}</div>
        </div>
      ))}
    </section>
  );
}

/** Live demo mini — mọi control là component thật, state thật. */
function LiveDemo() {
  const [chips, setChips] = useState<Record<string, boolean>>({ tokens: true, a11y: true, motion: false });
  const [compress, setCompress] = useState(true);
  const [tab, setTab] = useState('Tổng quan');

  return (
    <Card title="Sờ thử ngay — không cái nào là ảnh" className="scroll-mt-6" hoverable={false}>
      <div id="bp-showcase-demo" className="flex flex-col gap-6">
        {/* Hàng Button 4 kiểu */}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="primary">Primary</Button>
          <Button>Default</Button>
          <Button type="text">Text</Button>
          <Button danger>Gán thất bại</Button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Cột trái: CheckableTag + Switch + Alert */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="text-label font-medium text-ink">Tag.Checkable — bộ lọc chọn được</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(chips).map(([label, on]) => (
                  <Tag.Checkable key={label} checked={on} onChange={(c) => setChips((s) => ({ ...s, [label]: c }))}>
                    {label}
                  </Tag.Checkable>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={compress}
                onChange={setCompress}
                checkedChildren="Bật"
                unCheckedChildren="Tắt"
                aria-label="Nén ảnh khi upload"
              />
              <Text className="m-0 text-body">Nén ảnh khi upload</Text>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-label font-medium text-ink">Alert — 4 trạng thái</div>
              <Alert type="success" message="Đã lưu thay đổi" />
              <Alert type="info" message="Đang đồng bộ lịch" />
              <Alert type="warning" message="Token sắp hết hạn" />
              <Alert type="error" message="Gán task thất bại" />
            </div>
          </div>

          {/* Cột phải: Segmented tabs + Timeline */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="text-label font-medium text-ink">Segmented — đổi tab thật</div>
              <Segmented
                value={tab}
                onChange={setTab}
                ariaLabel="Demo tab"
                options={[
                  { label: 'Tổng quan', value: 'Tổng quan' },
                  { label: 'Nhật ký', value: 'Nhật ký' },
                  { label: 'Cấu hình', value: 'Cấu hình' },
                ]}
              />
              <div className="min-h-16 rounded-lg border border-line bg-s3 p-3">
                <Text type="secondary" className="m-0 text-meta">
                  {tab === 'Tổng quan' && 'Panel đổi theo Segmented — nội dung thật, không screenshot.'}
                  {tab === 'Nhật ký' && '18:02 · alice gán task · 18:05 · binh chuyển Doing.'}
                  {tab === 'Cấu hình' && 'Toggle, slider, select — cùng ngôn ngữ token, cùng dark cascade.'}
                </Text>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-label font-medium text-ink">Timeline — 3 entry</div>
              <Timeline
                items={[
                  { key: 't1', color: 'var(--st-done)', children: 'Merge PR #56 — dọn nợ repo', label: 'hôm qua' },
                  { key: 't2', color: 'var(--accent)', children: 'Gate ui-kit xanh — 1235 tests', label: '2 giờ trước' },
                  { key: 't3', color: 'var(--st-doing)', children: 'Đang dựng trang này bằng chính kit', label: 'vừa xong' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** "Tại sao" — 6 Card + Icon, Reveal stagger 0/120/240ms theo cột. */
function WhyGrid() {
  return (
    <section className="flex flex-col gap-5">
      <Title level={2} style={{ marginBottom: 0 }} className="text-center">
        Vì sao chọn kit này
      </Title>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((r, i) => (
          <Reveal key={r.title} direction="up" delay={(i % 3) * 120}>
            <Card className="h-full">
              <span aria-hidden="true" className="mb-3 grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
                <Icon name={r.icon} size={18} />
              </span>
              <div className="text-body font-medium text-ink">{r.title}</div>
              <p className="m-0 mt-1 text-meta text-ink2">{r.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Footer CTA — Divider + mời đọc USAGE.md, recipes, Templates/*. */
function FooterCta() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-line bg-s1 p-8 text-center">
      <Title level={2} style={{ marginBottom: 0 }}>
        Giao diện kế tiếp, dựng bằng token
      </Title>
      <Text type="secondary" className="max-w-xl">
        Đọc USAGE.md cho quy ước bắt buộc, 16 recipe copy-chạy trong docs/ai/recipes.md — hoặc mở nhóm
        Templates/* để xem landing, dashboard, CRUD ghép từ chính những component vừa sờ ở trên.
      </Text>
      <Button type="primary" size="large" icon={<Icon name="external-link" size={14} />}>
        Mở Templates/Landing
      </Button>
      <Divider dashed className="w-full">
        tokens all the way down
      </Divider>
    </section>
  );
}

/** Showcase — trang cuộn 1 canvas: hero → stats → demo → vì sao → CTA. */
export const Showcase: Story = {
  name: 'Why Wakii UI Kit',
  render: () => (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 pb-6">
      <Hero />
      <StatsStrip />
      <LiveDemo />
      <WhyGrid />
      <FooterCta />
    </div>
  ),
};
