// HomePage — LANDING SHOWCASE (redesign 2026-10-25, motion pass): hero reveal
// + bento grid + marquee + stack diagram + demo access + CTA + footer.
// 100% tokens ui-kit; animation framer-motion (bundle local — KHÔNG vào MF
// shared); MotionConfig reducedMotion="user" — người dùng tắt motion thì mọi
// animation tắt theo nhưng nội dung đầy đủ.
import { MotionConfig } from 'framer-motion';
import { BentoGrid } from '../components/landing/BentoGrid';
import { DemoAccess } from '../components/landing/DemoAccess';
import { FinalCta, LandingFooter } from '../components/landing/CtaFooter';
import { Hero } from '../components/landing/Hero';
import { Marquee } from '../components/landing/Marquee';
import { StackSection } from '../components/landing/StackSection';

export function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col">
        <Hero />
        <Marquee />
        <BentoGrid />
        <StackSection />
        <DemoAccess />
        <FinalCta />
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
