// CHƯƠNG 05 · FUTURE — SF-6 (VU-53-CIN) theo EXPERIENCE-DESIGN.md v1.0 + ChapterShell SF-3.
// Cấu trúc: (1) ChapterShell tone="light" mood="future" + band 4 CountUp (format vi-VN)
// (2) SUN JOURNEY — chuyển cảnh dawn→night (§4: cung sin x 10→90% · y 20→8→20% · 4 pha,
//     h-[200vh] sticky; reduced-motion = frame tĩnh NIGHT) (3) END CTA glow.
// REF-SPEC: label mono 11px/700 tracking 2.64 · stat number font-light tabular ·
// H2 29px/300. Mood future (§2): band sáng s1→canvas, ink --ink theme-flip, nhấn --st-done.
// Footer numbered + social là NavFooter (worker D) — không nhân bản ở đây.
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { Button } from '../../../ui/button/index';
import { CountUp } from '../../../ui/count-up/index';
import { useSectionProgress } from '../lib/scroll-mood.js';
import { ChapterShell } from '../lib/ChapterShell.js';

const STATS = [
  { value: 1119, label: 'behavior tests' },
  { value: 624, label: 'stories trong Storybook' },
  { value: 30, label: 'component mới trong sóng', prefix: '+' },
  { value: 4, label: 'app FE đã app-fit' },
];

/** Kpi band — số font-light tabular ink, nhãn mono 11px/700 tracking 2.64 (§1). */
function Kpi({ value, label, prefix }: { value: number; label: string; prefix?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-baseline gap-0.5 text-4xl font-light tabular-nums text-ink">
        {prefix}
        <CountUp value={value} format={(n) => n.toLocaleString('vi-VN')} />
      </div>
      <span className="font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-ink3">{label}</span>
    </div>
  );
}

/* ── SUN JOURNEY (§4) — dawn→night, cung sin, 4 pha ──
 * Pha k chiếm quartile k của progress; opacity từng lớp sky = tam giác quanh tâm pha
 * (crossfade liên tục). Sun: x = 10 + p·80 (%), y = 20 − sin(p·π)·12 (%).
 * Màu cảnh là scene cục bộ tự chủ (giống hero starfield — không token flip). */
const PHASES = [
  { name: 'DAWN', sky: 'linear-gradient(180deg, #fce8c8 0%, #f8b26a 62%, #cdd8f6 100%)', sun: '#ffd08a' },
  { name: 'DAY', sky: 'linear-gradient(180deg, #ffffff 0%, #cdd8f6 70%, #dfe4fb 100%)', sun: '#fff3c4' },
  { name: 'DUSK', sky: 'linear-gradient(180deg, #f8b26a 0%, #5e6ad2 70%, #2a2f52 100%)', sun: '#ffb36a' },
  { name: 'NIGHT', sky: 'linear-gradient(180deg, #0a0c16 0%, #141530 100%)', sun: '#e8ecff' },
];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function SunJourney() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const p = reduced ? 0.99 : progress; // reduced-motion: frame tĩnh NIGHT (cuối chuỗi)
  const x = 10 + p * 80;
  const y = 20 - Math.sin(p * Math.PI) * 12;
  const phase = Math.min(3, Math.floor(p * 4));
  const nightAlpha = clamp01((p - 0.72) * 3.6);

  return (
    <div ref={ref} className="relative h-[200vh]" data-mood="future-sun">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* 4 lớp sky crossfade theo quartile */}
        {PHASES.map((ph, k) => (
          <div
            key={ph.name}
            aria-hidden="true"
            className="absolute inset-0 transition-[opacity] duration-100"
            style={{ background: ph.sky, opacity: clamp01(1 - Math.abs(p * 4 - (k + 0.5))) }}
          />
        ))}
        {/* Stars — hiện dần pha NIGHT */}
        <div aria-hidden="true" className="absolute inset-0" style={{ opacity: nightAlpha }}>
          {[
            [12, 18], [22, 9], [31, 26], [44, 12], [55, 30], [63, 7], [72, 21], [81, 14], [90, 28], [48, 42], [68, 48], [28, 40],
          ].map(([l, t], i) => (
            <span key={i} className="absolute size-[2px] rounded-pill bg-white/70" style={{ left: `${l}%`, top: `${t}%` }} />
          ))}
        </div>
        {/* Sun — cung sin (§4) */}
        <div
          aria-hidden="true"
          className="absolute size-24 -translate-x-1/2 -translate-y-1/2 rounded-pill"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            background: `radial-gradient(circle, ${PHASES[phase].sun} 0%, ${PHASES[phase].sun}55 46%, transparent 70%)`,
            filter: 'blur(0.5px)',
          }}
        />
        {/* Ground hairline */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <p className="absolute bottom-6 left-6 m-0 font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-white/85">
          {PHASES[phase].name} · sun {Math.round(x)}%·{Math.round(y)}%
        </p>
      </div>
    </div>
  );
}

/* ── END CTA glow — đêm tiếp nối sun-journey, nút sáng trọng tâm ── */
function EndCta() {
  return (
    <section data-mood="future-cta" className="relative overflow-hidden bg-[linear-gradient(180deg,#0a0c16_0%,#141530_100%)] px-6 py-28 text-center">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 animate-[bp-pulse-soft_2.4s_ease-in-out_infinite] rounded-pill"
        style={{ background: 'radial-gradient(circle, rgba(94,106,210,0.35) 0%, transparent 65%)' }}
      />
      <div className="relative">
        <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-white/85">Ready?</p>
        <h2 className="m-0 mt-3 text-[29px] font-light uppercase leading-snug tracking-[0.02em] text-white">
          Start building with Orca
        </h2>
        <p className="m-0 mt-4 text-[12px] leading-[1.7] tracking-[0.3px] text-white/92">
          Một hệ tokens — năm chương chuyển động. Consume qua source, sửa là thấy ngay.
        </p>
        <div className="mt-8">
          <Button
            size="large"
            type="primary"
            className="h-12 px-10 text-[12px] font-bold uppercase tracking-[2.4px] shadow-[0_0_56px_-8px_var(--accent)]"
          >
            Start building
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Ch5 Future — SF-6: band CountUp + Sun Journey dawn→night + End CTA glow. */
export default function Ch5Future() {
  return (
    <>
      <ChapterShell
        id="ch5"
        chapter="05"
        mood="future"
        tone="light"
        title="Bộ kit đã sẵn sàng. Giờ là lượt bạn build."
        copy="Một hệ tokens chạy suốt năm chương — và đội của bạn là chương tiếp theo."
      >
        <div className="mt-14 grid grid-cols-2 gap-10 md:grid-cols-4">
          {STATS.map((s) => (
            <Kpi key={s.label} value={s.value} label={s.label} prefix={s.prefix} />
          ))}
        </div>
      </ChapterShell>
      <SunJourney />
      <EndCta />
    </>
  );
}
