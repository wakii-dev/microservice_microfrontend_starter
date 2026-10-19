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
import { Icon } from '../../../index';
import { EXPERIENCE_CHAPTERS, SideNav } from '../lib/SideNav.js';

// Side-nav moved sang lib/SideNav (SF-3 — single-source, shell/nav-footer cùng dùng);
// CHAPTERS = EXPERIENCE_CHAPTERS cho footer nav lặp.
const CHAPTERS = EXPERIENCE_CHAPTERS;

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/wakii-dev/architecture-overview' },
  { label: 'Storybook', href: 'https://storybook-static-khaki-two.vercel.app' },
  { label: 'Changelog', href: 'https://github.com/wakii-dev/architecture-overview/blob/main/app/ui-kit/CHANGELOG.md' },
];

/** Chapter chrome: side-nav scroll-spy (trái, fixed) + footer brand/socials/nav lặp. */
export default function NavFooter(): JSX.Element {
  return (
    <>
      {/* SIDE-NAV — single-source từ lib/SideNav (SF-3); wrapper fixed pointer-events
          pattern nằm trong đó. */}
      <SideNav />

      {/* FOOTER — nền cascade từ shell; label nhạt theo REF-SPEC 220,225,236 ≈ white/85 */}
      <footer className="relative z-[1] mt-16 border-t border-white/10 bg-[var(--scrim-4)] px-[clamp(24px,5.3vw,68px)] py-10">
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
