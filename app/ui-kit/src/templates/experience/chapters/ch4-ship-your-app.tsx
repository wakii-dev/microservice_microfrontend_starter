// CHƯƠNG 04 · SHIP YOUR APP — OWNED BY @w8 (R6: chỉ đụng file này)
// CONTRACT (EXPERIENCE-DESIGN.md v0.1): export default Ch4ShipYourApp ·
// SectionMood id="ch4" mood="ship" className="relative h-[200vh]" · pattern
// PinnedShowcase (parallax-landing): sticky top-0 h-screen + 3 LỚP PARALLAX
// nền 0.08/280 · mid 0.3/240 · chữ 0.5/280 — pure CSS sticky, 0 scroll-hijack,
// 0 scroll listener riêng (mục 4). Scrim from-black/75 via-black/40; chữ trắng
// drop-shadow-md. Nội dung: Build → Gate → Ship (hành trình một đợt release).
import { Parallax } from '../../../ui/parallax/index';
import { Icon, type IconName } from '../../../ui/icons/index.js';
import { SectionMood } from '../lib/scroll-mood.js';

const STEPS: Array<{ num: string; icon: IconName; title: string; body: string }> = [
  {
    num: '01',
    icon: 'pencil',
    title: 'Build',
    body: 'Ghép trang từ 90+ primitives — Field, Card, Table, Board. Không component trùng, không hex lẻ.',
  },
  {
    num: '02',
    icon: 'check-circle',
    title: 'Gate',
    body: 'Vitest hành vi + typecheck + test-storybook + a11y — gate xanh mới được commit, report kèm verify paste thật.',
  },
  {
    num: '03',
    icon: 'arrow-up',
    title: 'Ship',
    body: 'Keep a Changelog với bullet đếm thật và hash commit — merge vào main chính là bản release.',
  },
];

export default function Ch4ShipYourApp() {
  return (
    <SectionMood id="ch4" mood="ship" className="relative h-[200vh]" style={{ background: 'linear-gradient(160deg, var(--chapter-bg-a), var(--chapter-bg-b))' }}>
      {/* PINNED — sticky 100vh trong 200vh: cuộn tiếp 1 màn, 3 lớp trôi 3 nhịp */}
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* Lớp NỀN — 0.08/280: gần như đứng yên (ảnh demo seeded, site thay bằng asset thật) */}
        <Parallax speed={0.08} strength={280} className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/wakii-ship/1600/1000"
            alt=""
            aria-hidden="true"
            className="size-full scale-125 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
        </Parallax>

        {/* Lớp GIỮA — 0.3/240: thẻ gate checklist trôi chậm */}
        <Parallax
          speed={0.3}
          strength={240}
          className="absolute left-6 top-1/4 hidden rounded-xl border border-white/20 bg-[var(--scrim-3)] px-5 py-4 backdrop-blur-sm sm:block"
        >
          <span className="text-[11px] font-bold uppercase tracking-[2.64px] text-white/80">Gate checklist</span>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
            {['vitest xanh', 'typecheck sạch', 'a11y pass'].map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-body text-white/85">
                <Icon name="check" size={12} className="text-st-done" />
                {item}
              </li>
            ))}
          </ul>
        </Parallax>

        {/* Lớp CHỮ — 0.5/280: dẫn đầu cuộn, 3 bước Build → Gate → Ship */}
        <Parallax speed={0.5} strength={280} className="relative z-10 max-w-2xl text-center">
          <p className="m-0 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[2.64px] text-white/70">
            <Icon name="upload" size={12} />
            Chapter 04 — Ship your app
          </p>
          <h2 className="m-0 mt-4 text-[29px] font-light leading-snug tracking-[0.02em] text-white drop-shadow-md">
            Ship your app.
          </h2>
          <p className="m-0 mt-4 text-[12px] tracking-[0.3px] text-white/85">
            Từ primitives đến release — ba bước, mỗi bước một gate.
          </p>
          <ol className="m-0 mt-8 flex list-none flex-col gap-4 p-0 text-left sm:flex-row sm:gap-6">
            {STEPS.map((step) => (
              <li key={step.num} className="flex-1">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[2.4px] text-white">
                  <Icon name={step.icon} size={12} className="text-accent" />
                  {step.num} · {step.title}
                </div>
                <p className="m-0 mt-1.5 text-meta leading-relaxed text-white/75">{step.body}</p>
              </li>
            ))}
          </ol>
        </Parallax>
      </div>
    </SectionMood>
  );
}
