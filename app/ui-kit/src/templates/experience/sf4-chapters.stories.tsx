// Templates/Cinematic Experience — SF-4 demo (Ch1 Deep focus + Ch2 Living docs).
// 2 chương THẬT theo ChapterShell v1.0 (KHÔNG demo generic — PO cấm). Panel đo
// góc phải trên: scroll % + transform Parallax ch1 + clip-path mask ch2 đổi theo
// cuộn — verify "measure transform + clip-path đổi theo scroll" bằng mắt (SF-4
// acceptance). Nền: MoodBackdrop stops focus→docs (chapters KHÔNG tự đặt nền đặc
// — shell v1.0 vignette alpha, màu mood page-wide lo).
import type { Meta, StoryObj } from '@storybook/react-vite';
import Ch1DeepFocus from './chapters/ch1-deep-focus';
import Ch2LivingDocs from './chapters/ch2-living-docs';
import { MOOD_STOPS, MoodBackdrop, usePageProgress } from './lib/scroll-mood.js';

const meta = { title: 'Templates/Cinematic Experience/SF-4 Chapters', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Panel đo scroll (demo-only): scroll % + transform Parallax ch1 + clip mask ch2.
 * usePageProgress re-render theo rAF khi cuộn → đọc DOM mỗi render. */
function MeasurePanel() {
  const pct = usePageProgress();
  const ch1Transform = document.querySelector<HTMLElement>('#ch1 [data-chapter-bg]')?.parentElement?.style.transform ?? '—';
  const ch2Clip = document.querySelector<HTMLElement>('#ch2 [data-mask-frame]')?.style.clipPath ?? '—';
  const ch1Short = ch1Transform === '—' ? '—' : ch1Transform.replace(/translate3d\(|, 0\)/g, '').trim() || '0px';
  const ch2Short = ch2Clip === '—' ? '—' : ch2Clip.replace(/inset\(0 |%\)/g, '').trim() + '%';
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-3 top-3 z-50 rounded-lg border border-white/15 bg-black/70 px-3 py-2 font-mono text-[10px] leading-[1.7] tracking-[1px] text-white/85"
    >
      scroll {(pct * 100).toFixed(0)}%
      <br />
      ch1 transform: {ch1Short}
      <br />
      ch2 clip: {ch2Short}
    </div>
  );
}

function Sf4Page() {
  return (
    <div className="relative">
      <MoodBackdrop stops={MOOD_STOPS.filter((s) => s.id === 'focus' || s.id === 'docs')} />
      <MeasurePanel />
      <Ch1DeepFocus />
      <Ch2LivingDocs />
    </div>
  );
}

/** SF-4 — Ch1 Deep focus (split 7/5 + focus stack + ghost 62.210 + 4 mini CountUp)
 * + Ch2 Living docs (3 feature mask-reveal graded) — measure panel góc phải trên. */
export const Sf4Chapters: Story = {
  name: 'SF-4 — Ch1 Deep focus + Ch2 Living docs (measure panel)',
  render: () => <Sf4Page />,
};

/** Ch1Only — soi 7 layer ch1 + reduced-motion. */
export const Ch1Only: Story = {
  name: 'Ch1 only — Deep focus giàu-lớp',
  render: () => (
    <div className="relative">
      <MoodBackdrop stops={[MOOD_STOPS[1]]} />
      <Ch1DeepFocus />
    </div>
  ),
};
