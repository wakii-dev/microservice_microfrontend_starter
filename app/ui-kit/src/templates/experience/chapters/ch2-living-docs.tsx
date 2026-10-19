// CHƯƠNG 02 · LIVING DOCS — SF-4 (owner @w6, board: SF-4 ch1+ch2). Contract
// EXPERIENCE-DESIGN.md v1.0 + ChapterShell glass-nav (KHÔNG nền đặc — MoodBackdrop
// page-wide lo màu; nội dung white-alpha cố định §6).
//
// 3 feature row xen kẽ trái/phải (§3 grid chapter md:grid-cols-2 gap-8):
// - Text: kicker mono 11px/700 tracking 2.64 accent + heading h3 29px/300 + body
//   12px/400 tracking 0.3 leading 1.7 — Reveal direction luân phiên (§4).
// - Ảnh graded §5: grayscale + duotone overlay accent→done mix-blend-multiply
//   TRONG wrapper bị clip (mask reveal cả lớp grading) + vignette scrim-2 NGOÀI
//   clip (frame effect).
// - Mask-reveal: clip-path inset theo useSectionProgress (§4 — ch2/ch3 ảnh),
//   hướng lộ theo phía đọc (flip → lộ phải→trái).
import { Parallax, Reveal } from '../../../index';
import { ChapterShell } from '../lib/ChapterShell.js';
import { useSectionProgress } from '../lib/scroll-mood.js';

interface Feature {
  kicker: string;
  /** Punchy 2 dòng — render xuống dòng bằng <br/> (REF-SPEC copy punchy). */
  title: [string, string];
  body: string;
  seed: string;
  alt: string;
  speed: number;
}

const FEATURES: Feature[] = [
  {
    kicker: 'SPRINT 42 · BOARD',
    title: ['Kéo ORC-108 qua cột —', 'docs tự đi theo.'],
    body: 'Story demo chạy thật trong trang: thẻ đổi cột, log giờ, toast — không screenshot chết.',
    seed: 'wakii-docs-source',
    alt: 'Bảng sprint kéo thẻ với tài liệu cập nhật theo',
    speed: 0.3,
  },
  {
    kicker: 'EVIDENCE 1440 + 375',
    title: ['Mọi thay đổi UI', 'đều để lại ảnh chứng minh.'],
    body: 'Layout, motion, dark mode — evidence chụp cả 2 chế độ trước khi merge, PO duyệt bằng mắt.',
    seed: 'wakii-docs-evidence',
    alt: 'Bộ evidence screenshot UI ở hai kích thước màn hình',
    speed: 0.24,
  },
  {
    kicker: 'THEME · MOOD LIVE',
    title: ['Đổi mood chương —', 'chart đổi màu tức thì.'],
    body: 'Token cascade qua CSS var: board, chart, worklog cùng nhịp — không đụng code component.',
    seed: 'wakii-docs-theme',
    alt: 'Giao diện chuyển mood sáng tối theo thời gian thực',
    speed: 0.18,
  },
];

/** 1 feature row — xen kẽ trái/phải; ảnh graded §5 + mask-reveal theo scroll. */
function FeatureRow({ feature, flip }: { feature: Feature; flip: boolean }) {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const pct = Math.round(progress * 100);
  // Mask đối xứng hướng đọc: trái → lộ trái→phải; phải → lộ phải→trái
  const clip = flip ? `inset(0 0 0 ${100 - pct}%)` : `inset(0 ${100 - pct}% 0 0)`;
  return (
    <div data-feature-row="" className="mx-auto grid w-full max-w-5xl items-center gap-8 py-16 md:grid-cols-2 md:gap-12">
      <Reveal direction={flip ? 'right' : 'left'} delay={80} className={flip ? 'md:order-2' : undefined}>
        <div className="grid gap-3">
          <span data-kicker="" className="font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-accent">
            {feature.kicker}
          </span>
          {/* Heading row h3 (shell đã dùng h2 chương) — 29px/300 leading-snug §1. */}
          <h3 className="m-0 text-[29px] font-light leading-snug tracking-[0.02em] text-white">
            {feature.title[0]}
            <br />
            {feature.title[1]}
          </h3>
          <p className="m-0 max-w-md text-[12px] leading-[1.7] tracking-[0.3px] text-white/85">{feature.body}</p>
        </div>
      </Reveal>
      <div ref={ref} data-mask-frame="" style={{ clipPath: clip }} className={flip ? 'md:order-1' : undefined}>
        <Parallax speed={feature.speed} strength={240} className="relative">
          <div className="relative overflow-hidden rounded-xl">
            {/* Wrapper bị clip CHỨA ảnh + duotone — mask reveal cả lớp grading (§5.4) */}
            <img
              src={`https://picsum.photos/seed/${feature.seed}/880/560`}
              alt={feature.alt}
              loading="lazy"
              className="aspect-[11/7] w-full object-cover grayscale"
            />
            <div
              data-duotone=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-accent/25 via-transparent to-st-done/20 mix-blend-multiply"
            />
          </div>
          {/* Vignette mép — NGOÀI clip (frame effect), scrim token §5.3 */}
          <div
            data-vignette=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl [box-shadow:inset_0_0_90px_var(--scrim-2)]"
          />
        </Parallax>
      </div>
    </div>
  );
}

/** CHƯƠNG 02 — Living docs: shell header + 3 feature xen kẽ mask-reveal graded. */
export default function Ch2LivingDocs() {
  return (
    <ChapterShell
      id="ch2"
      chapter="02"
      mood="docs"
      title="Living docs"
      copy="Mỗi claim dưới đây là demo sống trong trang — kéo, bấm, đổi mood là thấy ngay."
    >
      {FEATURES.map((f, i) => (
        <FeatureRow key={f.kicker} feature={f} flip={i % 2 === 1} />
      ))}
    </ChapterShell>
  );
}
