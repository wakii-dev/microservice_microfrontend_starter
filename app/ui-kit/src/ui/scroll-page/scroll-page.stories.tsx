// ScrollPage stories — full-page snap scroll (không wheel-hijack): basic 4 màn,
// indicator, keyboard demo, auto slideshow, dark theme.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, Statistic } from '../../index';
import { ScrollPage } from './index';

const meta = { title: 'Navigation/ScrollPage', tags: ['autodocs'] } satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

const MOODS = [
  { bg: 'bg-s1', title: '01 — Bắt đầu', copy: 'Cuộn touchpad/trackpad bình thường — scroll-snap giữ nhịp từng màn.' },
  { bg: 'bg-s3', title: '02 — Làm việc', copy: 'Mỗi Section min-h-screen, snap-start — không wheel-hijack, không giật.' },
  { bg: 'bg-s2', title: '03 — Đào sâu', copy: 'Nội dung tự do trong Section — cards, stats, timeline tuỳ ý.' },
  { bg: 'bg-s3', title: '04 — Kết', copy: 'Indicator dots phải phản ánh section active qua IntersectionObserver.' },
];

/** Basic — 4 section snap full-page, indicator bật. */
export const Basic: Story = {
  name: 'Basic — 4 sections, snap-mandatory, indicator dots',
  render: () => (
    <ScrollPage ariaLabel="ScrollPage demo" className="rounded-xl border border-line">
      {MOODS.map((m) => (
        <ScrollPage.Section key={m.title} className={m.bg} ariaLabel={m.title}>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-ink3">
            {m.title.split(' — ')[0]}
          </span>
          <h2 className="m-0 mt-3 text-[29px] font-light uppercase tracking-[0.06em] text-ink">
            {m.title.split(' — ')[1]}
          </h2>
          <p className="m-0 mt-3 max-w-prose text-body text-ink2">{m.copy}</p>
        </ScrollPage.Section>
      ))}
    </ScrollPage>
  ),
};

/** Indicator — dots bên phải, aria-current theo section active (IO). */
export const IndicatorDemo: Story = {
  name: 'Indicator — dots accent theo section active (aria-current)',
  render: () => (
    <ScrollPage ariaLabel="Indicator demo" indicator className="rounded-xl border border-line">
      <ScrollPage.Section className="bg-s2" ariaLabel="Tổng quan">
        <Statistic title="Section active" value="1 / 4" />
      </ScrollPage.Section>
      <ScrollPage.Section className="bg-s1" ariaLabel="Chi tiết">
        <p className="m-0 max-w-prose text-body text-ink2">Dot nhỏ ô vuông — active bg-accent, còn lại ink3/50.</p>
      </ScrollPage.Section>
      <ScrollPage.Section className="bg-s3" ariaLabel="Cấu hình">
        <p className="m-0 max-w-prose text-body text-ink2">indicator={false} để ẩn — scroll thuần.</p>
      </ScrollPage.Section>
      <ScrollPage.Section className="bg-s2" ariaLabel="Kết">
        <Badge variant="doing">IntersectionObserver</Badge>
      </ScrollPage.Section>
    </ScrollPage>
  ),
};

/** KeyboardDemo — Arrow/PageUp/Down/Home/End nhảy section, focus container trước. */
export const KeyboardDemo: Story = {
  name: 'Keyboard — Tab vào container rồi ArrowUp/Down/PageUp/Down/Home/End',
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-line bg-s3 p-3 text-body text-ink2">
        <strong className="text-ink">Bàn phím:</strong> Tab vào khung → <kbd className="text-accent">↓/↑</kbd> một màn ·{' '}
        <kbd className="text-accent">PageDown/PageUp</kbd> · <kbd className="text-accent">Home/End</kbd> đầu/cuối.
        Reduced-motion → cuộn tức thì (không smooth).
      </div>
      <ScrollPage ariaLabel="Keyboard demo" keyboard className="h-96 rounded-xl border border-line">
        <ScrollPage.Section className="bg-s2" ariaLabel="Một">Màn một</ScrollPage.Section>
        <ScrollPage.Section className="bg-s1" ariaLabel="Hai">Màn hai</ScrollPage.Section>
        <ScrollPage.Section className="bg-s3" ariaLabel="Ba">Màn ba</ScrollPage.Section>
      </ScrollPage>
    </div>
  ),
};

/** AutoSlideshow — autoPlay 2500ms, hover để tạm dừng, wrap vòng về màn đầu. */
export const AutoSlideshow: Story = {
  name: 'Auto slideshow — autoPlay 2500ms, hover pause, wrap vòng',
  render: () => (
    <ScrollPage ariaLabel="Auto slideshow" autoPlay={2500} indicator className="h-96 rounded-xl border border-line">
      {MOODS.slice(0, 3).map((m, i) => (
        <ScrollPage.Section key={m.title} className={m.bg} ariaLabel={m.title}>
          <div className="flex items-center gap-4">
            <Badge variant={i === 0 ? 'doing' : 'done'}>{`slide ${i + 1}`}</Badge>
            <p className="m-0 text-body text-ink2">
              {m.copy} Hover vào khung để tạm dừng slideshow.
            </p>
            <Button size="small" onClick={() => undefined}>
              Action {i + 1}
            </Button>
          </div>
        </ScrollPage.Section>
      ))}
    </ScrollPage>
  ),
};

/** DarkTheme — mood tối, dots nổi trên nền. */
export const DarkTheme: Story = {
  name: 'DarkTheme — các màn mood tối, dot active accent',
  render: () => (
    <div data-bp-theme="dark">
      <ScrollPage ariaLabel="Dark demo" className="rounded-xl border border-line">
        {MOODS.map((m) => (
          <ScrollPage.Section key={m.title} className="bg-s2" ariaLabel={m.title}>
            <h2 className="m-0 text-[29px] font-light uppercase text-white">{m.title}</h2>
            <p className="m-0 mt-2 max-w-prose text-body text-white/70">{m.copy}</p>
          </ScrollPage.Section>
        ))}
      </ScrollPage>
    </div>
  ),
};
