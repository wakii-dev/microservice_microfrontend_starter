// CHƯƠNG 02 · LIVING DOCS — OWNED BY @w7 (R6: chỉ đụng file này)
// CONTRACT (EXPERIENCE-DESIGN.md v0.1) + REF-SPEC (docs/team/ref/):
// - export default function Ch2LivingDocs() — SectionMood id="ch2" mood="docs"
//   className="relative min-h-screen" (mood cascade --c-s2, KHÔNG nền đặc).
// - 3 feature card Parallax XEN KẼ trái/phải (speed 0.12/0.18/0.15) + mask-reveal
//   clip-path inset theo useSectionProgress từ '../lib/scroll-mood.js'.
// - REF-SPEC typography: label MONO 11px/700 uppercase tracking 2.64 · heading
//   ~29px/300 light · body 12px/400 tracking 0.3 · H1 18px/300.
// - Ảnh GRADED duotone/vignette đồng bộ palette (grayscale + overlay accent/done
//   mix-blend-multiply + vignette scrim token) — overlays nằm TRONG wrapper bị
//   clip để mask reveal cả lớp grading (không lộ gradient trước ảnh).
// - Copy punchy 2 dòng Orca-flavored (board/sprint/evidence/mood). Motion chỉ
//   Parallax/Reveal (tự tắt reduced-motion); a11y h1/h2; tokens-only.
import { Parallax, Reveal } from '../../../index';
import { SectionMood, useSectionProgress } from '../lib/scroll-mood.js';

interface Feature {
  kicker: string;
  /** Punchy 2 dòng — render xuống dòng bằng <br/>. */
  title: [string, string];
  body: string;
  seed: string;
  alt: string;
  speed: number;
}

const FEATURES: Feature[] = [
  {
    kicker: 'SPRINT 42 · BOARD',
    title: ['Kéo ORCA-108 qua cột —', 'docs tự đi theo.'],
    body: 'Story demo chạy thật trong trang: thẻ đổi cột, log giờ, toast — không screenshot chết.',
    seed: 'wakii-docs-source',
    alt: 'Bảng sprint kéo thẻ với tài liệu cập nhật theo',
    speed: 0.12,
  },
  {
    kicker: 'EVIDENCE 1440 + 375',
    title: ['Mọi thay đổi UI', 'đều để lại ảnh chứng minh.'],
    body: 'Layout, motion, dark mode — evidence chụp cả 2 chế độ trước khi merge, PO duyệt bằng mắt.',
    seed: 'wakii-docs-evidence',
    alt: 'Bộ evidence screenshot UI ở hai kích thước màn hình',
    speed: 0.18,
  },
  {
    kicker: 'THEME · MOOD LIVE',
    title: ['Đổi mood chương —', 'chart đổi màu tức thì.'],
    body: 'Token cascade qua CSS var: board, chart, worklog cùng nhịp — không đụng code component.',
    seed: 'wakii-docs-theme',
    alt: 'Giao diện chuyển mood sáng tối theo thời gian thực',
    speed: 0.15,
  },
];

/** 1 feature row — xen kẽ trái/phải; ảnh duotone/vignette + mask-reveal theo scroll. */
function FeatureRow({ feature, flip }: { feature: Feature; flip: boolean }) {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const pct = Math.round(progress * 100);
  // Mask đối xứng hướng đọc: trái → lộ trái→phải; phải → lộ phải→trái
  const clip = flip ? `inset(0 0 0 ${100 - pct}%)` : `inset(0 ${100 - pct}% 0 0)`;
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-8 px-6 py-16 md:grid-cols-2 md:gap-12">
      <Reveal direction={flip ? 'right' : 'left'} className={flip ? 'md:order-2' : undefined}>
        <div className="grid gap-3">
          {/* REF-SPEC label: MONO 11px/700 uppercase tracking 2.64 */}
          <span className="font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-accent">
            {feature.kicker}
          </span>
          {/* REF-SPEC H2: ~29px/300 light */}
          <h2 className="m-0 text-[29px] font-light leading-[1.25] text-white">
            {feature.title[0]}
            <br />
            {feature.title[1]}
          </h2>
          {/* REF-SPEC body: 12px/400 tracking 0.3 */}
          <p className="m-0 max-w-md text-[12px] leading-[1.7] tracking-[0.3px] text-white/85">{feature.body}</p>
        </div>
      </Reveal>
      <div ref={ref} className={flip ? 'md:order-1' : undefined}>
        <Parallax speed={feature.speed} strength={80}>
          <div className="relative overflow-hidden rounded-xl border border-line shadow-lift">
            {/* Wrapper bị clip chứa ảnh + grading — mask reveal CẢ lớp duotone/vignette */}
            <div className="relative" style={{ clipPath: clip }}>
              <img
                src={`https://picsum.photos/seed/${feature.seed}/880/560`}
                alt={feature.alt}
                loading="lazy"
                className="aspect-[11/7] w-full object-cover grayscale"
              />
              {/* Duotone đồng bộ palette: accent → done, multiply trên ảnh xám */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-accent/25 via-transparent to-st-done/20 mix-blend-multiply"
              />
            </div>
            {/* Vignette mép — scrim token, theme-independent */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [box-shadow:inset_0_0_90px_var(--scrim-2)]"
            />
            <span className="absolute bottom-2 right-2 rounded-pill bg-[var(--scrim-3)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[2px] text-white">
              mask {pct}%
            </span>
          </div>
        </Parallax>
      </div>
    </div>
  );
}

/** Chương 02 — Living docs: header + 3 feature xen kẽ trái/phải (mask-reveal graded). */
export default function Ch2LivingDocs() {
  return (
    <SectionMood id="ch2" mood="docs" className="relative min-h-screen" style={{ background: 'linear-gradient(160deg, var(--chapter-bg-a), var(--chapter-bg-b))' }}>
      <div className="py-10">
        <header className="mx-auto max-w-5xl px-6 pb-4">
          <Reveal direction="up">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-white/60">
              Chương 02 · Orca Experience
            </span>
            <h1 className="mb-2 mt-3 text-[18px] font-light leading-snug tracking-[0.3px] text-white">
              Living docs<span className="text-accent">.</span> Tài liệu chạy, thở và đổi màu cùng sản phẩm.
            </h1>
            <p className="m-0 max-w-xl text-[12px] leading-[1.7] tracking-[0.3px] text-white/85">
              Mỗi claim dưới đây là demo sống trong trang — kéo, bấm, đổi theme là thấy.
            </p>
          </Reveal>
        </header>
        {FEATURES.map((f, i) => (
          <FeatureRow key={f.kicker} feature={f} flip={i % 2 === 1} />
        ))}
      </div>
    </SectionMood>
  );
}
