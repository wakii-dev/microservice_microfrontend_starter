// NAV + FOOTER — OWNED BY @d (R6: chỉ đụng file này)
// CONTRACT (EXPERIENCE-DESIGN.md v0.1):
// - export default function NavFooter() — KHÔNG SectionMood (không phải chương).
// - Nav: Anchor side-nav sticky (component Anchor ui-kit, items 5 chương
//   href #ch1..#ch5 — labels 'CHƯƠNG 01..05') + numbered nav lặp ở footer.
// - Footer: social Icon links (external-link — bộ 50 không có brand glyph) +
//   brand ORCA × WAKII mono + copyright demo.
// - Nav sticky: wrapper fixed pointer-events-none, nav pointer-events-auto —
//   không che tương tác của nội dung chương bên dưới.
// REF-SPEC (experience.staratlas.com, 1280×800 — số đo computed):
// - Label 11px/700 UPPERCASE tracking 2.64px, màu nhạt rgb(220,225,236) ≈ text-white/85.
// - Display 12px/700 UPPERCASE tracking 2.4px (brand/CTA).
// - Chất editorial: LIGHT weight + tracking rộng — KHÔNG bold to.
// IP: sao cấu trúc/bố cục/kỹ thuật — nội dung Orca tự viết, không copy copy/ảnh ref.
import type { JSX } from 'react';
import { Anchor, Icon } from '../../../index';

const CHAPTERS = [
  { id: 'ch1', num: '01', title: 'Deep focus' },
  { id: 'ch2', num: '02', title: 'Living docs' },
  { id: 'ch3', num: '03', title: 'Team velocity' },
  { id: 'ch4', num: '04', title: 'Ship your app' },
  { id: 'ch5', num: '05', title: 'Future' },
];

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/wakii-dev/architecture-overview' },
  { label: 'Storybook', href: 'https://storybook-static-khaki-two.vercel.app' },
  { label: 'Changelog', href: 'https://github.com/wakii-dev/architecture-overview/blob/main/app/ui-kit/CHANGELOG.md' },
];

/** Chapter chrome: side-nav scroll-spy (trái, fixed) + footer brand/socials/nav lặp. */
export default function NavFooter(): JSX.Element {
  return (
    <>
      {/* SIDE-NAV — wrapper fixed pointer-events-none (không che chương), nav riêng
          pointer-events-auto. Scroll-spy do Anchor đảm nhiệm (aria-current + dot accent);
          offsetTop 96 = ngưỡng active dưới header shell. Ẩn < md — chương tự center. */}
      <div className="pointer-events-none fixed inset-y-0 left-6 z-[var(--z-popover)] hidden w-44 items-center md:flex">
        <nav aria-label="Chương" className="pointer-events-auto">
          {/* offsetTop 0 theo đề xuất v1 được hội đồng ưa chuộng: shell header là overlay
              không chiếm flow → không còn 2 sticky xô; contract v1.0 chốt lại nếu khác.
              Một nguồn duy nhất: số (mono) + title CÙNG flow dòng (flex items-baseline) —
              fix bug chồng lớp: hết layer 'CHƯƠNG 0X' riêng lẻ đè lên title. */}
          <Anchor
            offsetTop={0}
            items={CHAPTERS.map((c) => ({
              href: `#${c.id}`,
              title: (
                <span className="flex items-baseline gap-2">
                  <span aria-hidden="true" className="font-mono text-[11px] font-bold tracking-[2.64px] text-white/60">
                    {c.num}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[2.64px] text-white/85">
                    {c.title}
                  </span>
                </span>
              ),
            }))}
          />
        </nav>
      </div>

      {/* FOOTER — nền cascade từ shell; label nhạt theo REF-SPEC 220,225,236 ≈ white/85 */}
      <footer className="relative z-[1] mt-16 border-t border-white/10 px-[clamp(24px,5.3vw,68px)] py-10">
        <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-5">
            {/* Brand mono — display 12px/700 tracking 2.4px (REF-SPEC) */}
            <span className="font-mono text-[12px] font-bold uppercase tracking-[2.4px] text-white/85">
              ORCA × WAKII
            </span>
            <p className="m-0 max-w-prose text-[12px] tracking-[0.3px] text-white/60">
              Bộ UI kit kể chuyện bằng chính component của nó — 5 chương, một hành trình cuộn.
              Nội dung demo Orca; chất trải nghiệm tham khảo cấu trúc staratlas.com.
            </p>
            {/* Nav lặp — numbered, label 11px/700 tracking 2.64px (REF-SPEC) */}
            <nav aria-label="Chương (lặp)" className="flex flex-wrap gap-x-5 gap-y-2">
              {CHAPTERS.map((c) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  className="text-[11px] font-bold uppercase tracking-[2.64px] text-white/85 no-underline transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  Chương {c.num}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            {/* Socials — external-link (bộ 50 không có brand glyph, rule 9) */}
            <div className="flex flex-col gap-2 md:items-end">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2.64px] text-white/85 no-underline transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <Icon name="external-link" size={11} />
                  {s.label}
                </a>
              ))}
            </div>
            <span className="text-[11px] tracking-[0.3px] text-white/60">
              © 2026 WAKII — demo experience, không chord affil với staratlas.com.
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
