// Templates/Parallax Landing — v2 theo phản hồi PO (nâng toàn diện):
// 1. Parallax `strength` mới (default 120 giữ tương thích; 240–360 chuyển động đậm).
// 2. Nền ĐỨNG YÊN kiểu Apple/Jira: hero BG speed 0.08 (drift ~13px/600 scroll) +
//    nội dung speed 0.5 strength 280 (drift ~187px) — đảo chiều so với v1.
// 3. Hiệu ứng đỉnh: sticky-pinned section (200vh + sticky h-screen, 3 lớp speed
//    khác nhau — pure CSS sticky, 0 scroll-hijack) · mask-reveal ảnh (clip-path
//    inset theo scroll progress — template-local helper rAF, không component mới)
//    · nền crossfade 3 layer (canvas → s2 → accent/10) theo scroll.
// 4. Độ đọc: scrim đậm from-black/75 via-black/40 + chữ hero drop-shadow-md.
// reduced-motion: Parallax tự tắt (useMediaQuery); gallery đảo: ảnh chậm, caption nhanh.
import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Button, CountUp, Icon, Parallax, Reveal, useMediaQuery } from '../index';

const meta = { title: 'Templates/Parallax Landing', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const fmt = (n: number) => n.toLocaleString('vi-VN');

/** Progress scroll toàn trang 0..1 — 1 listener duy nhất ở root (rAF-throttle). */
function usePageProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setPct(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return pct;
}

/** Progress 0..1 của 1 section đi qua viewport — template-local (rAF, pattern Parallax). */
function useSectionProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setProgress(Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return { ref, progress };
}

/** Rail tiến độ dọc — height % accent trên track line2 (fixed trái). */
function ScrollProgressRail({ pct }: { pct: number }) {
  return (
    <div
      aria-hidden="true"
      className="fixed left-3 top-1/2 z-[var(--z-dropdown)] flex h-44 w-1 -translate-y-1/2 flex-col justify-end overflow-hidden rounded-pill bg-line2"
    >
      <div className="w-full rounded-pill bg-accent transition-[height] duration-150" style={{ height: `${Math.round(pct * 100)}%` }} />
    </div>
  );
}

/** Nền crossfade 3 layer theo scroll: canvas → s2 → accent/10 (fixed, dưới content). */
function CrossfadeBackdrop({ pct }: { pct: number }) {
  const canvasOpacity = pct < 0.5 ? 1 - pct * 2 : 0;
  const s2Opacity = pct < 0.5 ? pct * 2 : 2 - pct * 2;
  const accentOpacity = pct > 0.5 ? (pct - 0.5) * 2 : 0;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-canvas" style={{ opacity: canvasOpacity }} />
      <div className="absolute inset-0 bg-s2" style={{ opacity: s2Opacity }} />
      <div className="absolute inset-0 bg-accent/10" style={{ opacity: accentOpacity }} />
    </div>
  );
}

/** KPI đếm số — CountUp + nhãn uppercase (scrim đậm phía sau đảm bảo đọc). */
function Kpi({ value, decimals = 0, suffix, label }: { value: number; decimals?: number; suffix?: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-baseline gap-1 text-h1 font-bold text-white drop-shadow-md">
        <CountUp value={value} decimals={decimals} format={fmt} />
        {suffix && <span className="text-h2 font-semibold">{suffix}</span>}
      </div>
      <span className="text-meta uppercase tracking-[0.08em] text-white/80">{label}</span>
    </div>
  );
}

/** Hero NỀN ĐỨNG YÊN: BG speed 0.08 (drift ~13px/600 — gần fixed), nội dung
 * speed 0.5 strength 280 (drift ~187px — trôi QUA nền đứng). Scrim đậm + drop-shadow. */
function Hero() {
  return (
    <header className="relative h-[560px] overflow-hidden">
      <Parallax speed={0.08} className="absolute inset-0">
        <img
          src="https://picsum.photos/seed/wakii-hero/1600/1000"
          alt=""
          className="size-full scale-125 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
      </Parallax>
      <Parallax speed={0.5} strength={340} className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center">
        <Reveal direction="up">
          <span className="rounded-pill border border-white/20 bg-[var(--scrim-2)] px-3 py-1 text-meta text-white">
            motion identity — v2.3
          </span>
        </Reveal>
        <Reveal direction="up" delay={80}>
          <h1 className="m-0 max-w-2xl text-[44px] font-bold leading-tight text-white drop-shadow-md">
            Ship work, not tooling — kể chuyện bằng chuyển động
          </h1>
        </Reveal>
        <Reveal direction="up" delay={160}>
          <p className="m-0 max-w-xl text-body text-white/85 drop-shadow-sm">
            Nền đứng yên, nội dung trôi qua — mắt khoá ngay tiêu đề giữa chuyển động.
          </p>
        </Reveal>
        <Reveal direction="up" delay={240}>
          <div className="flex flex-wrap items-center justify-center gap-10 rounded-xl border border-white/15 bg-[var(--scrim-3)] px-10 py-4 backdrop-blur-sm">
            <Kpi value={12480} label="task đã giao" />
            <Kpi value={99.98} decimals={2} suffix="%" label="uptime" />
            <Kpi value={320} label="đội nhóm" />
          </div>
        </Reveal>
        <Reveal direction="up" delay={320}>
          <Button type="primary" size="large">
            Khởi đầu miễn phí
          </Button>
        </Reveal>
      </Parallax>
    </header>
  );
}

const SECTIONS = [
  {
    seed: 'wakii-board',
    title: 'Bảng việc biết đi về đâu',
    desc: 'Cột, thẻ, kéo-thả — WIP limit chặn trước khi quá tải.',
    features: ['Kéo-thả native 0 deps', 'Keyboard: Space → Arrows → Enter', 'Badge count realtime qua Kafka events'],
  },
  {
    seed: 'wakii-saga',
    title: 'Saga rõ ràng — thất bại không im lặng',
    desc: 'Gán task fail@demo.local để thấy compensation chạy thật.',
    features: ['Outbox pattern — event không mất', 'DLQ + badge “gán thất bại”', 'Re-assign có chủ đích, không tự reset'],
  },
  {
    seed: 'wakii-dark',
    title: 'Một token — hai theme',
    desc: 'data-bp-theme cascade; component không code riêng cho dark.',
    features: ['Contrast audit 0 lỗi', 'Tooltip surface sáng hơn trên dark', 'prefers-reduced-motion tự tắt motion'],
  },
];

/** Section xen kẽ — ảnh Reveal theo chiều vào + features stagger delay. */
function FeatureSections() {
  return (
    <>
      {SECTIONS.map((s, i) => {
        const imgDir = i % 2 ? 'right' : 'left';
        const textDir = i % 2 ? 'left' : 'right';
        return (
          <section key={s.seed} className="mx-auto grid max-w-5xl items-center gap-8 px-10 py-16 md:grid-cols-2">
            <Reveal direction={imgDir}>
              <img
                src={`https://picsum.photos/seed/${s.seed}/720/480`}
                alt=""
                className="w-full rounded-xl border border-line object-cover"
              />
            </Reveal>
            <div className="grid gap-4">
              <Reveal direction={textDir}>
                <h2 className="m-0 text-h2 font-bold text-ink">{s.title}</h2>
                <p className="mb-0 mt-2 text-body text-ink2">{s.desc}</p>
              </Reveal>
              <ul className="m-0 grid list-none gap-2 p-0">
                {s.features.map((feature, k) => (
                  <li key={feature}>
                    <Reveal direction={textDir} delay={120 + k * 90}>
                      <div className="flex items-center gap-2 rounded-lg border border-line bg-s2 px-3 py-2 text-body text-ink2">
                        <Icon name="check" size={14} className="shrink-0 text-st-done" />
                        {feature}
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </>
  );
}

/** STICKY-PINNED — 200vh ngoài, khung sticky h-screen trong; 3 lớp parallax
 * (nền 0.08 strength 280 · mid 0.3 strength 240 · chữ 0.5 strength 280) trôi
 * lệch nhịp SUỐT thời gian ghim — pure CSS sticky, 0 scroll-hijack. */
function PinnedShowcase() {
  return (
    <section aria-label="Showcase ghim khung hình" className="relative h-[200vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <Parallax speed={0.08} strength={280} className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/wakii-pinned/1600/1000"
            alt=""
            className="size-full scale-125 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
        </Parallax>
        <Parallax speed={0.3} strength={240} className="absolute left-10 top-1/4 rounded-xl border border-white/20 bg-[var(--scrim-3)] px-5 py-3 backdrop-blur-sm">
          <span className="text-meta uppercase tracking-[0.08em] text-white/80">lớp giữa — 0.3 / 240</span>
        </Parallax>
        <Parallax speed={0.5} strength={280} className="relative max-w-2xl text-center">
          <h2 className="m-0 text-h1 font-bold text-white drop-shadow-md">Ghim khung — ba lớp ba nhịp</h2>
          <p className="m-0 mt-3 text-body text-white/85">
            Cuộn tiếp 1 màn hình nữa: nền hầu như đứng, thẻ giữa trôi chậm, chữ dẫn đầu.
          </p>
        </Parallax>
      </div>
    </section>
  );
}

/** MASK-REVEAL — ảnh lộ dần trái→phải: clip-path inset(0 X% 0 0) theo scroll
 * progress của section (template-local helper, rAF — không component mới). */
function MaskRevealShowcase() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const pct = Math.round(progress * 100);
  return (
    <section ref={ref} className="mx-auto grid max-w-5xl items-center gap-8 px-10 py-16 md:grid-cols-2">
      <div className="relative">
        <img
          src="https://picsum.photos/seed/wakii-mask/720/480"
          alt=""
          className="w-full rounded-xl border border-line object-cover"
          style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
        />
        <span className="absolute bottom-2 right-2 rounded-pill bg-[var(--scrim-3)] px-2 py-0.5 text-meta text-white">
          mask {pct}%
        </span>
      </div>
      <div className="grid gap-3">
        <h2 className="m-0 text-h2 font-bold text-ink">Mask reveal theo cuộn</h2>
        <p className="m-0 text-body text-ink2">
          clip-path inset chạy theo tiến độ section — ảnh lộ dần từ trái sang phải
          khi bạn cuộn qua (cuộn lên sẽ phủ ngược lại).
        </p>
      </div>
    </section>
  );
}

/** Quote strip — ảnh gần đứng (0.08), chữ trôi nhanh (0.35 strength 240). */
function QuoteStrip() {
  return (
    <figure className="relative m-0 h-[380px] overflow-hidden">
      <Parallax speed={0.08} className="absolute inset-0">
        <img
          src="https://picsum.photos/seed/wakii-quote/1600/900"
          alt=""
          className="size-full scale-125 object-cover"
        />
        <div className="absolute inset-0 bg-[var(--scrim-3)]" />
      </Parallax>
      <Parallax speed={0.35} strength={240} className="absolute inset-0 flex items-center justify-center p-12">
        <Reveal direction="up">
          <blockquote className="m-0 max-w-2xl text-center">
            <p className="m-0 text-[28px] font-semibold leading-snug text-white drop-shadow-md">
              «Depth không phải trang trí — nó là cách mắt biết đang ở đâu.»
            </p>
            <figcaption className="mt-3 text-meta uppercase tracking-[0.08em] text-white/70">
              — motion identity, hand-off §6
            </figcaption>
          </blockquote>
        </Reveal>
      </Parallax>
    </figure>
  );
}

const GALLERY: Array<[string, number, number]> = [
  ['wakii-g1', 0.08, 0.4],
  ['wakii-g2', 0.12, 0.45],
  ['wakii-g3', 0.16, 0.5],
];

/** Gallery ĐẢO — ảnh nền chậm (gần đứng), caption trôi nhanh qua mặt ảnh. */
function ParallaxGallery() {
  return (
    <section className="mx-auto max-w-5xl px-10 pb-6 pt-2">
      <h2 className="m-0 mb-4 text-h2 font-bold text-ink">Gallery — ảnh đứng, caption trôi</h2>
      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        {GALLERY.map(([seed, imgSpeed, capSpeed]) => (
          <div key={seed} className="relative h-56 overflow-hidden rounded-xl border border-line">
            <Parallax speed={imgSpeed} className="absolute inset-0">
              <img
                src={`https://picsum.photos/seed/${seed}/600/760`}
                alt=""
                className="size-full scale-125 object-cover"
              />
            </Parallax>
            <Parallax speed={capSpeed} strength={240} className="absolute inset-x-3 bottom-3">
              <span className="block rounded-lg bg-[var(--scrim-3)] px-3 py-1.5 text-label text-white backdrop-blur-sm">
                {seed} — ảnh {imgSpeed}, caption {capSpeed}
              </span>
            </Parallax>
          </div>
        ))}
      </div>
      <p className="mb-0 mt-2 text-meta text-ink3">
        Đảo chiều so với v1: ảnh gần đứng (0.08–0.16), caption trôi nhanh (0.4–0.5).
      </p>
    </section>
  );
}

/** Sun journey — mặt trời đi cung theo scroll (PO 2026-10-18): 1 scroll listener
 * rAF set CSS custom props (--sun-x/--sun-y/--sun-core/--o-dawn|day|dusk|night/
 * --sun-ink/--sun-text-shadow) — 0 re-render/frame. 4 pha: dawn #ffb26b → noon
 * #fff7d6 → dusk #ff7e47 → night (trăng nhỏ + starfield, trời token ink→scrim-4).
 * Hex theo spec PO (sun-journey); reduced-motion: đứng ở noon. */
const SUN_PHASES = ['#ffb26b', '#fff7d6', '#ff7e47', '#dfe7ff'];
const SUN_TEXT = [
  '0 1px 10px rgba(255, 140, 60, 0.5)',
  'none',
  '0 1px 10px rgba(255, 110, 50, 0.5)',
  '0 1px 8px rgba(160, 190, 255, 0.45)',
];

function lerpColor(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const mix = pa.map((c, i) => Math.round(c + (pb[i]! - c) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function SunJourney() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = (journey: number) => {
      const angle = journey * Math.PI;
      el.style.setProperty('--sun-x', `${10 + journey * 80}%`);
      el.style.setProperty('--sun-y', `${20 - Math.sin(angle) * 12}%`);
      const f = journey * 3;
      const i = Math.min(2, Math.floor(f));
      const t = Math.min(1, f - i);
      el.style.setProperty('--sun-core', lerpColor(SUN_PHASES[i]!, SUN_PHASES[i + 1]!, t));
      const o = (phase: number) => Math.max(0, 1 - Math.abs(f - phase)).toFixed(3);
      el.style.setProperty('--o-dawn', o(0));
      el.style.setProperty('--o-day', o(1));
      el.style.setProperty('--o-dusk', o(2));
      el.style.setProperty('--o-night', o(3));
      const night = f > 2.5;
      el.style.setProperty('--sun-ink', night ? 'rgba(255, 255, 255, 0.92)' : 'rgba(0, 0, 0, 0.88)');
      el.style.setProperty('--sun-text-shadow', SUN_TEXT[Math.min(3, Math.round(f))]!);
    };
    if (reduced) {
      apply(1 / 3); // noon — đứng yên
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const span = r.height - window.innerHeight;
        const journey = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
        apply(journey);
      });
    };
    onScroll();
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <section
      ref={ref}
      aria-label="Sun journey"
      className="relative h-[300vh]"
      style={{ '--sun-x': '10%', '--sun-y': '20%', '--sun-core': SUN_PHASES[0], '--o-dawn': '1' } as CSSProperties}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* 4 layer trời crossfade theo pha */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #ffe3c2, #ffb26b)', opacity: 'var(--o-dawn)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #dbeafe, #eff6ff)', opacity: 'var(--o-day)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #c7b8e8, #ff7e47)', opacity: 'var(--o-dusk)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--ink), var(--scrim-4))', opacity: 'var(--o-night)' }} />
        {/* starfield night — pattern lặp, opacity theo --o-night */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            opacity: 'var(--o-night)',
            backgroundImage:
              'radial-gradient(1px 1px at 25px 35px, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 75px 85px, rgba(255,255,255,0.7), transparent), radial-gradient(1.5px 1.5px at 110px 40px, rgba(255,255,255,0.8), transparent)',
            backgroundSize: '140px 140px',
          }}
        />
        {/* mặt trăng nhỏ (night) */}
        <div
          aria-hidden="true"
          className="absolute size-10 rounded-full bg-white/90 shadow-[inset_-10px_0_0_0_rgba(20,30,60,0.25)]"
          style={{ left: '70%', top: '14%', opacity: 'var(--o-night)' }}
        />
        {/* mặt trời — radial glow + haze (KHÔNG ảnh) */}
        <div
          aria-hidden="true"
          className="absolute size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: 'var(--sun-x)', top: 'var(--sun-y)', background: 'radial-gradient(circle, color-mix(in srgb, var(--sun-core) 35%, transparent), transparent 70%)', filter: 'blur(28px)' }}
        />
        <div
          aria-hidden="true"
          className="absolute size-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: 'var(--sun-x)', top: 'var(--sun-y)', background: 'radial-gradient(circle, var(--sun-core) 0%, color-mix(in srgb, var(--sun-core) 45%, transparent) 55%, transparent 72%)' }}
        />
        {/* nội dung — màu chữ + text-shadow đổi theo pha */}
        <div
          className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-10 text-center"
          style={{ color: 'var(--sun-ink)', textShadow: 'var(--sun-text-shadow, none)' }}
        >
          <p className="m-0 text-[12px] font-bold uppercase tracking-[2.4px] opacity-70">Sun journey</p>
          <h2 className="m-0 max-w-2xl text-h2 font-bold">Mặt trời đi cung theo cuộn — dawn, noon, dusk, night</h2>
          <p className="m-0 max-w-xl text-body opacity-80">
            Vị trí, màu và ánh sáng phủ toàn bộ chạy bằng 4 CSS custom props — không re-render từng frame.
          </p>
        </div>
      </div>
    </section>
  );
}

/** CTA cuối — CountUp tổng + nút lớn. */
function FinalCta() {
  return (
    <section className="grid justify-items-center gap-5 px-10 py-20 text-center">
      <Reveal direction="up">
        <h2 className="m-0 text-h1 font-bold text-ink">Sẵn sàng kể chuyện bằng chuyển động?</h2>
      </Reveal>
      <Reveal direction="up" delay={100}>
        <div className="flex flex-wrap items-center justify-center gap-10 text-body text-ink2">
          <span className="text-h2 font-bold text-ink">
            <CountUp value={12480} format={fmt} /> <span className="text-body font-normal text-ink3">task</span>
          </span>
          <span className="text-h2 font-bold text-ink">
            <CountUp value={320} /> <span className="text-body font-normal text-ink3">đội nhóm</span>
          </span>
          <span className="text-h2 font-bold text-ink">
            <CountUp value={0} /> <span className="text-body font-normal text-ink3">deps chuyển động</span>
          </span>
        </div>
      </Reveal>
      <Reveal direction="up" delay={200}>
        <Button type="primary" size="large" icon={<Icon name="arrow-right" size={14} />}>
          Bắt đầu miễn phí
        </Button>
      </Reveal>
    </section>
  );
}

function ParallaxLandingPage() {
  const pct = usePageProgress();
  return (
    <div className="relative">
      <CrossfadeBackdrop pct={pct} />
      <ScrollProgressRail pct={pct} />
      <Hero />
      <FeatureSections />
      <PinnedShowcase />
      <MaskRevealShowcase />
      <SunJourney />
      <QuoteStrip />
      <ParallaxGallery />
      <FinalCta />
    </div>
  );
}

/** Full page — nền đứng yên + nội dung trôi qua, pinned 200vh, mask reveal, crossfade. */
export const Landing: Story = {
  name: 'Landing v2 — nền đứng (0.08) + content 0.5/280 + pinned + mask + crossfade',
  render: () => <ParallaxLandingPage />,
};

/** HeroDepth — riêng hero để đo: BG drift <15px, content drift >120px trên 600 scroll. */
export const HeroDepth: Story = {
  name: 'Hero depth đảo — nền 0.08 gần đứng, nội dung 0.5/280 trôi qua',
  render: () => (
    <div>
      <Hero />
      <div className="grid h-[420px] place-items-center text-body text-ink3">
        Cuộn 600px: nền dịch ~13px, nội dung dịch ~187px.
      </div>
    </div>
  ),
};

/** PinnedAndMask — sticky-pinned + mask reveal gọn để soi từng hiệu ứng. */
export const PinnedAndMask: Story = {
  name: 'Pinned showcase + mask reveal — 2 hiệu ứng đỉnh',
  render: () => (
    <div>
      <PinnedShowcase />
      <MaskRevealShowcase />
    </div>
  ),
};

/** SunJourney — mặt trời đi cung 4 pha dawn/noon/dusk/night theo scroll. */
export const SunJourneyPhase: Story = {
  name: 'Sun journey — mặt trời đi cung, 4 pha trời crossfade, night moon+stars',
  render: () => <SunJourney />,
};
