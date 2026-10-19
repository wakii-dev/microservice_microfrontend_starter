// CHƯƠNG 05 · FUTURE — OWNED BY @w6 (R6: chỉ đụng file này)
// CONTRACT (EXPERIENCE-DESIGN.md v0.1):
// - export default function Ch5Future() — SectionMood id="ch5" mood="future"
//   className="relative min-h-screen" + style nền tự chủ: linear-gradient(160deg, var(--chapter-bg-a), var(--chapter-bg-b)); mood nền sáng
//   (data-mood="future" → canvas) nên text dùng token ink/* KHÔNG text-white (PO contrast fix 2026-10-18).
// - Nội dung brief: band 4 CountUp (format vi-VN — pattern Kpi parallax-landing)
//   + CTA cuối "Start building" (Button type=primary size=large).
// REF-SPEC: nhãn stat 11px/700 uppercase tracking 2.64px; số lớn font-light.
import { Button } from '../../../ui/button/index';
import { CountUp } from '../../../ui/count-up/index';
import { SectionMood } from '../lib/scroll-mood.js';

const STATS = [
  { value: 1119, label: 'behavior tests', decimals: 0 },
  { value: 624, label: 'stories trong Storybook', decimals: 0 },
  { value: 30, label: 'component mới trong sóng', decimals: 0, prefix: '+' },
  { value: 4, label: 'app FE đã app-fit', decimals: 0 },
];

/** Kpi band — pattern parallax-landing nhưng nền SÁNG: số font-light ink, nhãn ink3. */
function Kpi({ value, label, prefix }: { value: number; label: string; prefix?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-baseline gap-0.5 text-h1 font-light tabular-nums text-ink">
        {prefix}
        <CountUp value={value} format={(n) => n.toLocaleString('vi-VN')} />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[2.64px] text-ink3">{label}</span>
    </div>
  );
}

export default function Ch5Future() {
  return (
    <SectionMood
      id="ch5"
      mood="future"
      className="relative min-h-screen"
      style={{ background: 'linear-gradient(160deg, var(--chapter-bg-a), var(--chapter-bg-b))' }}
    >
      <div className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="m-0 text-[12px] font-bold tracking-[2.4px] text-ink3 uppercase">Chapter 05 — The Future</p>
        <h2 className="m-0 mt-4 text-[clamp(1.5rem,2.3vw,29px)] leading-snug font-light text-ink">
          Bộ kit đã sẵn sàng.
          <span className="block text-accent">Giờ là lượt bạn build.</span>
        </h2>

        {/* Band 4 CountUp — responsive 2×2 mobile → 4 cột desktop */}
        <div className="mt-14 grid grid-cols-2 gap-10 md:grid-cols-4">
          {STATS.map((s) => (
            <Kpi key={s.label} value={s.value} label={s.label} prefix={s.prefix} />
          ))}
        </div>

        {/* CTA cuối — Button primary large (nền accent, chữ trắng) */}
        <div className="mt-16">
          <Button size="large" type="primary" className="h-12 px-10 text-[12px] font-bold uppercase tracking-[2.4px] shadow-[0_0_48px_-10px_var(--accent)]">
            Start building
          </Button>
          <p className="m-0 mt-6 text-[12px] tracking-[0.3px] text-ink3">
            Consumed qua source — npm install một lần, sửa component thấy ngay.
          </p>
        </div>
      </div>
    </SectionMood>
  );
}
