// CHƯƠNG 01 · DEEP FOCUS — OWNED BY @w6 (R6: chỉ đụng file này)
// CONTRACT (EXPERIENCE-DESIGN.md v0.1 — gate check từng mục):
// - export default function Ch1DeepFocus() — KHÔNG props, data demo tự chứa.
// - Dùng SectionMood từ '../lib/scroll-mood.js': <SectionMood id="ch1" mood="focus"
//   className="relative min-h-[200vh]"> (chương 2 màn — số khổng lồ + split-text).
// - Mood nền: cascade từ CrossfadeBackdrop của index (data-mood="focus" → --c-s1)
//   — KHÔNG tự đặt nền đặc; overlay cục bộ dùng bg-[var(--scrim-*)] nếu cần.
// - Nội dung brief: CountUp 62.210 'giờ tập trung' (format vi-VN) + parallax ảnh
//   nền gần-fixed (Parallax speed 0.08 strength 280) + split-text reveal từng chữ
//   (stagger CSS chars — tự viết trong file, không component mới).
// - Motion: chỉ Parallax/Reveal/CountUp (tự tắt reduced-motion); a11y: h2 + CTA
//   button/a thật; id="ch1" cho Anchor.
// REF-SPEC: số counter LIGHT 300 (editorial — "KHÔNG bold to"), nhãn 12px/700
// uppercase tracking 2.4px, body nhỏ 12px/400 tracking 0.3px (docs/team/ref/).
import { CountUp } from '../../../ui/count-up/index';
import { Icon } from '../../../ui/icons/index.js';
import { Parallax } from '../../../ui/parallax/index';
import { SectionMood } from '../lib/scroll-mood.js';

const HEADLINE = 'giờ tập trung';

/** Split-text per-letter — stagger CSS tự viết; reduced-motion → chữ hiện tĩnh
 * (motion-reduce variant — không phụ thuộc animation forwards). */
function SplitText({ text }: { text: string }) {
  return (
    <span aria-label={text} className="inline-flex flex-wrap justify-center">
      {[...text].map((ch, i) =>
        ch === ' ' ? (
          <span key={i} aria-hidden="true" className="w-[0.35em]" />
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className="inline-block opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none animate-[bp-slide-up-in_600ms_var(--ease-enter)_forwards]"
            style={{ animationDelay: `${120 + i * 45}ms` }}
          >
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

export default function Ch1DeepFocus() {
  return (
    <SectionMood id="ch1" mood="focus" className="relative min-h-[200vh]">
      {/* MÀN 1 — số khổng lồ trên Parallax nền gần-fixed (speed 0.08 / strength 280) */}
      <div className="relative grid min-h-screen place-items-center overflow-hidden">
        <Parallax speed={0.08} strength={280} scale className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=70"
            alt=""
            aria-hidden="true"
            className="h-[120%] w-full object-cover opacity-25"
          />
        </Parallax>
        {/* Scrim cục bộ qua token scrim — mood cascade vẫn lo nền chương */}
        <div aria-hidden="true" className="absolute inset-0 bg-[var(--scrim-1)]" />

        <div className="relative z-10 px-6 text-center">
          <p className="m-0 flex items-center justify-center gap-2 text-[12px] font-bold tracking-[2.4px] text-ink3 uppercase">
            <Icon name="clock" size={12} />
            Chapter 01 — Deep Focus
          </p>
          <div className="mt-6 text-[clamp(4.5rem,14vw,11rem)] leading-none font-light tracking-tight tabular-nums text-ink">
            <CountUp value={62210} duration={2.2} format={(n) => n.toLocaleString('vi-VN')} />
          </div>
          <p className="m-0 mt-4 text-[12px] leading-relaxed tracking-[0.3px] text-ink2">
            Mỗi block tập trung đều được log vào worklog — con số chạy tiếp khi bạn cuộn.
          </p>
        </div>
      </div>

      {/* MÀN 2 — split-text reveal + CTA anchor thật sang chương 02 */}
      <div className="relative grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h2 className="m-0 text-[clamp(1.25rem,3.5vw,2rem)] font-light tracking-[0.3em] text-accent uppercase">
            <SplitText text={HEADLINE} />
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-[12px] leading-relaxed tracking-[0.3px] text-ink2">
            Tập trung không phải cảm hứng — đó là hạ tầng: block thời gian, worklog tự
            động, và một con số bạn tin được.
          </p>
          <a
            href="#ch2"
            className="mt-10 inline-flex h-12 items-center gap-2 rounded-lg border border-line bg-s2 px-8 text-[12px] font-bold tracking-[2.4px] text-ink uppercase transition-colors hover:border-accent-hi hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            Xem chương 02
            <Icon name="arrow-down" size={14} />
          </a>
        </div>
      </div>
    </SectionMood>
  );
}
