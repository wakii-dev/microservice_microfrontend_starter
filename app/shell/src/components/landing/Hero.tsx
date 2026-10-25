// Hero — landing showcase opening (mission boilerplate-redesign + bổ túc
// Scene3D): headline reveal từng từ (framer-motion stagger) + sub gradient +
// CTA + version Tag + 3D tilt card + NỀN Scene3D (starfield WebGL qua subpath
// experience3d — lazy chunk tách khỏi main bundle; three là peer shell đã cài;
// jsdom/thiếu WebGL → fallback blob gradient, reduced-motion → kit tự 1 frame
// tĩnh). Tokens-only; MotionConfig reducedMotion="user" ở HomePage.
import { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button, Icon, Tag } from '@wakii/ui-kit';

const HEADLINE = ['Ship', 'full-stack,', 'not', 'tooling'];

// Lazy chunk — import() async tách Scene3D + three khỏi main bundle (pattern
// chart của kit: specifier chuỗi → rspack build async chunk, runtime load chắc
// chắn vì three đã nằm trong node_modules của shell).
const Scene3D = lazy(() => import('@wakii/ui-kit/experience3d').then((m) => ({ default: m.Scene3D })));

/** Blob gradient token — Suspense fallback + fallback khi WebGL thiếu. */
function BlobGradient() {
  // testid cho landing.test (jsdom không WebGL — assert fallback thay canvas)
  return (
    <div data-testid="hero-scene-fallback" className="absolute inset-0">
      <div className="absolute -top-24 left-1/4 size-72 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute right-1/4 top-16 size-56 rounded-full bg-st-done/10 blur-3xl" />
    </div>
  );
}

/** Nền Scene3D — canvas tuyệt đối sau text, pointer-events-none (không che CTA). */
function Scene3DBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Suspense fallback={<BlobGradient />}>
        <Scene3D
          className="pointer-events-none absolute inset-0 rounded-none opacity-90"
          height="100%"
          fallback={<BlobGradient />}
        />
      </Suspense>
    </div>
  );
}

/** Thẻ nghiêng 3D theo con trỏ — showcase "kit card" mini (stats + code). */
function TiltCard() {
  const ref = useRef<HTMLDivElement>(null);
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 260, damping: 22 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 260, damping: 22 });
  // glare — vệt sáng theo góc nghiêng Y (trắng mờ 8%, không hex)
  const glare = useTransform(rotateY, [-10, 0, 10], ['25%', '50%', '75%']);
  const glareBackground = useTransform(glare, (x) => `radial-gradient(360px circle at ${x} 30%, rgba(255, 255, 255, 0.08), transparent 65%)`);

  return (
    <div
      className="relative w-full max-w-md [perspective:900px]"
      onPointerMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        rotateYRaw.set(px * 16);
        rotateXRaw.set(-py * 12);
      }}
      onPointerLeave={() => {
        rotateXRaw.set(0);
        rotateYRaw.set(0);
      }}
    >
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative overflow-hidden rounded-xl border border-line bg-s1 p-6 text-left shadow-[var(--shadow-pop)]"
      >
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: glareBackground }} />
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-2 text-label font-medium text-ink2">
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-md bg-accent/15 text-accent">
              <Icon name="menu-bars" size={12} />
            </span>
            @wakii/ui-kit
          </span>
          <Tag>v0.5.0</Tag>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-line bg-s2 p-3">
            <div className="text-meta text-ink3">Components</div>
            <div className="text-h1 font-bold text-ink">90+</div>
          </div>
          <div className="rounded-lg border border-line bg-s2 p-3">
            <div className="text-meta text-ink3">Tests pass</div>
            <div className="text-h1 font-bold text-ink">1235</div>
          </div>
        </div>
        <pre className="relative m-0 mt-4 overflow-x-auto rounded-lg border border-line bg-s3 p-3 font-mono text-meta text-ink2">
          <code>{`import { Button } from '@wakii/ui-kit';`}</code>
        </pre>
      </motion.div>
    </div>
  );
}

/** Hero — phần trên landing: nền Scene3D + headline stagger + CTA + tilt card. */
export function Hero() {
  return (
    <section aria-label="Intro" className="relative flex flex-col items-center gap-8 pt-10 text-center">
      {/* nền 3D (starfield WebGL) — lỗi/thiếu WebGL tự rơi blob gradient */}
      <Scene3DBackground />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Tag icon={<Icon name="check-circle" size={12} />}>Boilerplate — MF host + 2 remotes + 3 BE services</Tag>
      </motion.div>

      {/* headline reveal từng từ — aria-label ở h1, spans aria-hidden cho SR đọc liền */}
      <h1 className="m-0 max-w-3xl text-[44px] font-bold leading-tight tracking-[-0.02em] text-ink" aria-label="Ship full-stack, not tooling">
        {HEADLINE.map((word, i) => (
          <motion.span
            key={word}
            aria-hidden="true"
            className="inline-block"
            initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {i < HEADLINE.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="m-0 max-w-xl bg-gradient-to-r from-ink2 via-accent to-ink2 bg-clip-text text-body text-transparent"
      >
        Module federation host, tasks + activity remotes, three backend services and one
        design system — wired end-to-end and ready to fork.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        <Link to="/tasks" className="no-underline">
          <Button type="primary" size="large">
            Explore tasks
          </Button>
        </Link>
        <Link to="/activity" className="no-underline">
          <Button type="text" size="large">
            View activity
          </Button>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mt-2 flex w-full justify-center pb-6"
      >
        <TiltCard />
      </motion.div>
    </section>
  );
}
