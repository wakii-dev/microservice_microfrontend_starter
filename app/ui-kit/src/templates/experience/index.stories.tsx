// Templates/Cinematic Experience — composition (owner @v2, contract EXPERIENCE-DESIGN.md).
// Ghép Hero + 5 chương (team điền theo contract từng file) + Anchor side-nav làm
// progress + mood provider: `--mood-progress` (0..1) set trên wrapper → chapters
// đọc qua CSS var; nền crossfade do CrossfadeBackdrop (lib/scroll-mood) lo.
// Stubs render null lúc skeleton — trang đầy dần khi team điền, không đụng file nhau.
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Hero from './chapters/hero';
import Ch1DeepFocus from './chapters/ch1-deep-focus';
import Ch2LivingDocs from './chapters/ch2-living-docs';
import Ch3TeamVelocity from './chapters/ch3-team-velocity';
import Ch4ShipYourApp from './chapters/ch4-ship-your-app';
import Ch5Future from './chapters/ch5-future';
import NavFooter from './chapters/nav-footer';
import { CrossfadeBackdrop, usePageProgress } from './lib/scroll-mood.js';

const meta = { title: 'Templates/Cinematic Experience', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ExperiencePage() {
  const pct = usePageProgress();
  return (
    <div className="relative" style={{ '--mood-progress': pct } as CSSProperties}>
      <CrossfadeBackdrop pct={pct} />

      {/* Side-nav + footer: nguồn duy nhất là chapters/nav-footer (worker D) — placeholder
       * Anchor ở đây đã GỠ để hết chồng lớp 'CHƯƠNG 0X' (bugfix R10 2026-10-18). */}

      <Hero />
      <Ch1DeepFocus />
      <Ch2LivingDocs />
      <Ch3TeamVelocity />
      <Ch4ShipYourApp />
      <Ch5Future />
      <NavFooter />
    </div>
  );
}

/** Full experience — hero starfield + 5 chương theo mood bands (EXPERIENCE-DESIGN.md). */
export const Experience: Story = {
  name: 'Experience — 5 chương + hero starfield + Anchor progress',
  render: () => <ExperiencePage />,
};

/** HeroOnly — starfield + trailer Modal, gọn để soi canvas + reduced-motion. */
export const HeroOnly: Story = {
  name: 'Hero only — starfield 3 lớp + mouse-parallax + trailer Modal',
  render: () => <Hero />,
};
