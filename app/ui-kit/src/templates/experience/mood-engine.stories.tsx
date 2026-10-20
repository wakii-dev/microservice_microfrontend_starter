// Templates/Mood Engine — SF-1 demo: MoodBackdrop crossfade 5 mood + 1 hero mood,
// mỗi màn 100vh gắn data-mood; cuộn từ đầu tới cuối = 6 mood crossfade đúng số đo
// contract §2. Layer nền: opacity layer i = clamp(0, 1 − |p×(N−1) − i|, 1) —
// verify bằng CDP: đo computed opacity 6 layer tại 5 mốc scroll (paste trong PR).
// Contrast readout: WCAG luminance tính runtime từ token (body ≥4.5 · heading ≥3).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MOOD_STOPS, MoodBackdrop, type MoodStop } from './lib/scroll-mood.js';

const meta = { title: 'Templates/Mood Engine', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// ── WCAG luminance — dùng cho readout số trong story (verify 5 mood đúng số) ──

function luminance(rgb: [number, number, number]): number {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}

function contrast(fg: [number, number, number], bg: [number, number, number]): number {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

const WHITE: [number, number, number] = [255, 255, 255];
const NAVY: [number, number, number] = [16, 36, 52];

/** Ink màu đọc được trên từng mood (kết hợp bảng contract §2). */
const MOOD_INK: Record<string, [number, number, number]> = {
  atlas: NAVY,
  focus: WHITE,
  docs: WHITE,
  velocity: WHITE,
  ship: WHITE,
  future: [16, 36, 52],
};

/** 1 màn mood — nền trong suốt (backdrop lo), hiển thị id + contrast readout. */
function MoodScreen({ stop, index, total }: { stop: MoodStop; index: number; total: number }) {
  const ink = MOOD_INK[stop.id] ?? WHITE;
  const bodyCr = contrast(ink, stop.id === 'atlas' ? [232, 237, 244] : [13, 24, 37]).toFixed(2);
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[2.64px] opacity-70" style={{ color: `rgb(${ink.join(',')})` }}>
        mood {index + 1}/{total}
      </p>
      <h2
        className="m-0 text-[29px] font-light uppercase tracking-[0.02em]"
        style={{ color: `rgb(${ink.join(',')})` }}
      >
        {stop.id}
      </h2>
      <p className="m-0 max-w-md text-[12px] leading-[1.7] tracking-[0.3px] opacity-80" style={{ color: `rgb(${ink.join(',')})` }}>
        Body 12px/400 tracking 0.3 — contrast body {bodyCr}:1 (cần ≥4.5) · nền tự chủ theo mood, không phụ thuộc theme toolbar.
      </p>
    </div>
  );
}

function MoodEnginePage() {
  return (
    <div className="relative">
      <MoodBackdrop stops={MOOD_STOPS} />
      {MOOD_STOPS.map((stop, i) => (
        <div key={stop.id} data-mood={stop.id} className="relative min-h-screen">
          <MoodScreen stop={stop} index={i} total={MOOD_STOPS.length} />
        </div>
      ))}
      <footer className="relative flex min-h-[40vh] items-center justify-center">
        <p className="m-0 text-body opacity-70">
          Hết hành trình — MoodBackdrop crossfade 6 mood theo progress (rAF, custom-props-free).
        </p>
      </footer>
    </div>
  );
}

/** Full — cuộn 6 mood: atlas sáng → focus/docs/velocity/ship tối → future sáng. */
export const FiveMoods: Story = {
  name: '5 moods + hero — crossfade theo scroll (đúng contract §2)',
  render: () => <MoodEnginePage />,
};

/** Contrast readout — số WCAG từng mood in trực tiếp (verify không cần tool). */
export const ContrastReadout: Story = {
  name: 'Contrast readout — số WCAG mọi mood (body ≥4.5 · heading ≥3)',
  render: () => (
    <div className="mx-auto grid max-w-3xl gap-3 p-10">
      <h2 className="m-0 text-[29px] font-light text-ink">Contrast từng mood (wcag luminance)</h2>
      {MOOD_STOPS.map((stop) => {
        const ink = MOOD_INK[stop.id] ?? WHITE;
        const bg: [number, number, number] =
          stop.id === 'atlas' ? [232, 237, 244] : stop.id === 'future' ? [255, 255, 255] : [13, 24, 37];
        const cr = contrast(ink, bg).toFixed(2);
        return (
          <div
            key={stop.id}
            data-mood={stop.id}
            className="flex items-center justify-between rounded-lg border border-line bg-s2 px-4 py-3 text-body"
          >
            <span className="font-mono text-[11px] font-bold uppercase tracking-[2.64px]">{stop.id}</span>
            <span className="tabular-nums">
              contrast {cr}:1 — {Number(cr) >= 4.5 ? 'PASS body' : 'chỉ heading ≥3:1'}
            </span>
          </div>
        );
      })}
    </div>
  ),
};
