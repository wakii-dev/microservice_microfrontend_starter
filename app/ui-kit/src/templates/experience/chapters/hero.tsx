// HERO — ORCA × WAKII Cinematic Experience (SF-2, contract EXPERIENCE-DESIGN v1.0
// + PO feedback "giàu lớp — hero depth nhiều lớp").
// Depth 9 lớp, mỗi lớp parallax speed RIÊNG (contract §4):
//   lưới toạ độ blueprint .04 · starfield canvas theme-aware .08 · sun/haze góc .12 ·
//   số LIGHTYEAR ghost .16 · chip dữ liệu nổi .26/.34/.44/.56 · khối display .5.
// Typographic drama: eyebrow mono 11/700/2.64 + display ALL-CAPS 3 dòng lệch khối
// (18/29/18px LIGHT — REF-SPEC: wow nằm ở scene, KHÔNG cỡ chữ to) + editorial 17px/400
// + số LIGHTYEAR khổng lồ mờ nền sau chữ. UI chrome: numbered header 01–05 + meta
// mono góc phải + CTA trailer white-box (chữ tối rgb(35,31,32)) + signup + mini-nav
// + thumbnail + scroll hint progress ring.
// Nền TỰ CHỦ sáng (mood atlas — --hero-ink cố định navy, KHÔNG flip dark); dark theme
// chỉ đảo MÀU HẠT sao (--navy-ink → #f7f8f8 "bông tuyết", Starfield tự lo).
// reduced-motion: Parallax/Reveal tự tắt, Starfield frame tĩnh, scrollIntoView 'auto'.
import { useState } from 'react';
import {
  Button,
  Chart,
  Icon,
  Modal,
  Parallax,
  Reveal,
  Typography,
  useMediaQuery,
  type ChartConfig,
} from '../../../index';
import { MOOD_STOPS, useSectionProgress } from '../lib/scroll-mood.js';
import { EXPERIENCE_CHAPTERS } from '../lib/SideNav.js';
import { Starfield } from '../lib/starfield.js';

/** Nền mood atlas — literal DUY NHẤT lấy từ MOOD_STOPS (contract §2, không nhắc lại hex). */
const ATLAS_BG = MOOD_STOPS.find((s) => s.id === 'atlas')!.background;

/** Màu nhấn ◆ của experience (contract §2 cột Dot). */
const DOT = '#ff5c39';

/* ── MiniSpark — SVG polyline (fallback cho sparkline khi chart.js thiếu/jsdom) ── */
function MiniSpark({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const coords = points
    .map((v, i) => `${(i / (points.length - 1)) * 80},${22 - ((v - min) / span) * 18}`)
    .join(' ');
  return (
    <svg aria-hidden="true" viewBox="0 0 80 24" className="h-7 w-20 shrink-0">
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Chip dữ liệu nổi — thẻ kính nhỏ: label mono + số tabular + sparkline Chart ── */
interface ChipSpec {
  label: string;
  value: string;
  points: number[];
  color: string;
}

function makeSpark(points: number[], color: string): ChartConfig {
  return {
    type: 'line',
    labels: points.map((_, i) => String(i)),
    datasets: [{ label: 'spark', data: points, borderColor: color, borderWidth: 2 }],
    options: {
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      // tension + ẩn point qua options (ChartDataset của kit chỉ định kiểu dataset hẹp)
      elements: { line: { tension: 0.4 }, point: { radius: 0 } },
    },
  };
}

function Chip({ spec }: { spec: ChipSpec }) {
  return (
    <div
      className="pointer-events-auto w-44 rounded-xl border p-3 shadow-lift backdrop-blur-sm"
      style={{ borderColor: 'rgba(16, 36, 52, 0.14)', background: 'rgba(255, 255, 255, 0.72)' }}
    >
      <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[2.4px] text-[var(--hero-ink)] opacity-70">
        {spec.label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <span className="text-xl font-bold tabular-nums text-[var(--hero-ink)]">{spec.value}</span>
        <Chart
          config={makeSpark(spec.points, spec.color)}
          height={28}
          fallback={<MiniSpark points={spec.points} color={spec.color} />}
        />
      </div>
    </div>
  );
}

/** 4 chip nổi quanh hero — tốc độ parallax + Reveal delay đều khác nhau (PO: nhiều lớp). */
const CHIPS: (ChipSpec & { pos: string; speed: number; delay: number })[] = [
  { label: 'Task shipped', value: '+2.4k', points: [4, 6, 5, 8, 7, 10, 9, 12], color: '#52c41a', pos: 'left-[50%] top-[22%]', speed: 0.26, delay: 150 },
  { label: 'Uptime 30 ngày', value: '99.98%', points: [9.96, 9.97, 9.98, 9.98, 9.99, 9.99, 10, 10], color: '#1677ff', pos: 'right-[5%] top-[40%]', speed: 0.34, delay: 230 },
  { label: 'Saga p95', value: '320ms', points: [9, 8, 8, 7, 6, 6, 5, 4], color: '#1677ff', pos: 'left-[38%] bottom-[16%]', speed: 0.44, delay: 310 },
  { label: 'Sprint velocity', value: '×1.3', points: [5, 6, 6, 7, 8, 8, 9, 10], color: '#ff5c39', pos: 'right-[16%] top-[23%]', speed: 0.56, delay: 390 },
];

/* ── Progress ring — SVG stroke-dash theo hero progress (useSectionProgress remap) ── */
function ProgressRing({ progress }: { progress: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  return (
    <svg aria-hidden="true" viewBox="0 0 22 22" className="size-[22px] -rotate-90">
      <circle cx="11" cy="11" r={r} fill="none" stroke="color-mix(in srgb, var(--hero-ink) 15%, transparent)" strokeWidth="2" />
      <circle
        cx="11"
        cy="11"
        r={r}
        fill="none"
        stroke={DOT}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
      />
    </svg>
  );
}

export default function Hero() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  // Parallax content (speed .5) CHỈ md+ — mobile các cluster in-flow dưới tâm viewport
  // sẽ bị dịch ~39px lên đè editorial (đo thật 375: gap −30px). BG layers không ảnh hưởng.
  const isMd = useMediaQuery('(min-width: 768px)');
  const [trailer, setTrailer] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { ref, progress } = useSectionProgress<HTMLElement>();
  // useSectionProgress trả 0.5 khi hero ở đỉnh trang (section đã "qua" nửa viewport
  // theo công thức chung) — remap về 0..1 cho ring: đỉnh trang = 0, cuộn hết hero = 1.
  const heroPct = Math.max(0, Math.min(1, (progress - 0.5) * 2));

  const enter = () => {
    document.querySelector('#ch1')?.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <header
      ref={ref}
      id="hero"
      data-mood="atlas"
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ background: ATLAS_BG }}
    >
      {/* ── LỚP NỀN — 3 lớp parallax tốc độ khác nhau (gần-fixed, contract speed .08) ── */}
      {/* Lưới toạ độ blueprint mờ — mask radial để lưới dày góc, tan giữa */}
      <Parallax speed={0.04} strength={280} className="absolute -inset-y-16 inset-x-0">
        <div
          aria-hidden="true"
          data-hero-grid=""
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--hero-ink) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--hero-ink) 7%, transparent) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(120% 90% at 50% 38%, black 25%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(120% 90% at 50% 38%, black 25%, transparent 78%)',
          }}
        />
      </Parallax>
      {/* Starfield — hạt trôi chậm, theme-aware (dark → bông tuyết light) */}
      <Parallax speed={0.08} strength={280} className="absolute -inset-y-16 inset-x-0">
        <Starfield className="absolute inset-0 h-full w-full" />
      </Parallax>
      {/* Sun/haze một góc (phải-trên) — glow trắng lõi + vành ấm, frecoration thuần CSS */}
      <Parallax speed={0.12} strength={280} className="absolute -inset-y-16 inset-x-0">
        <div
          aria-hidden="true"
          data-hero-sun=""
          className="absolute right-[6%] top-[-14%] size-[min(72vw,560px)] rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.6) 34%, rgba(255,196,150,0.3) 56%, rgba(255,255,255,0) 74%)',
          }}
        />
      </Parallax>

      {/* ── SỐ LIGHTYEAR GHOST — khổng lồ mờ NỀN SAU chữ (lớp .16, sau khối display) ── */}
      <Parallax
        speed={0.16}
        strength={280}
        className="pointer-events-none absolute inset-0 hidden md:block"
      >
        <p
          aria-hidden="true"
          data-hero-ghost=""
          className="absolute left-[8%] top-[10%] m-0 font-light leading-none tabular-nums text-[var(--hero-ink)] opacity-[0.06] text-[clamp(96px,14vw,190px)]"
        >
          12.842
          <span className="align-top text-[0.22em] tracking-[0.14em]"> LY</span>
        </p>
      </Parallax>

      {/* ── TOP BAR — brand · numbered header 01–05 · meta mono + CTA trailer ── */}
      <div className="relative z-20 flex items-center justify-between gap-6 pr-[clamp(24px,5.3vw,68px)] pl-[clamp(24px,5.3vw,68px)] md:pl-[clamp(228px,17vw,268px)] py-6">
        <a href="#hero" className="flex items-center gap-2 whitespace-nowrap no-underline">
          <span aria-hidden="true" style={{ color: DOT }}>
            ◆
          </span>
          <span className="text-[12px] font-bold uppercase tracking-[2.4px] text-[var(--hero-ink)]">
            ORCA × WAKII
          </span>
        </a>
        <nav aria-label="Chương (hero)" className="hidden items-center gap-6 lg:flex">
          {EXPERIENCE_CHAPTERS.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              aria-label={`Chương ${c.num} — ${c.title}`}
              className="font-mono text-[11px] font-bold tracking-[2.64px] text-[var(--hero-ink)] opacity-70 no-underline transition-opacity duration-150 hover:opacity-100"
            >
              {c.num} · {c.title}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <span className="hidden font-mono text-[10px] font-bold uppercase tracking-[2.4px] text-[var(--hero-ink)] opacity-70 xl:inline">
            orbit 0428.1 · tx 9f3a·c21b
          </span>
          <Button
            onClick={() => setTrailer(true)}
            aria-label="Xem trailer"
            className="h-12 whitespace-nowrap border-transparent bg-white px-4 shadow-lift md:px-6"
          >
            <span className="text-[12px] font-bold uppercase tracking-[2.4px] text-[rgb(35,31,32)]">
              <span className="sm:hidden">Trailer</span>
              <span className="hidden sm:inline">Watch the trailer</span>
            </span>
            <Icon name="angle-double-right" size={13} className="text-[#ff5c39]" />
          </Button>
        </div>
      </div>

      {/* ── KHỐI DISPLAY — eyebrow + 3 dòng ALL-CAPS lệch khối 18/29/18 + editorial ── */}
      <div className="relative z-10 mt-10 max-md:px-6 md:absolute md:left-[clamp(228px,17vw,268px)] md:top-[28%] md:mt-0">
        <Parallax speed={0.5} strength={280} disabled={!isMd} className="max-w-[560px]">
          <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-[var(--hero-ink)] opacity-70">
            Nền tảng task — kịch bản cinematic
          </p>
          {/* H1 hero 18px/300 LIGHT — contract §1; các dòng con 18/29/18 lệch khối */}
          <Typography.Title
            level={1}
            className="m-0 mt-4"
            style={{
              fontSize: 18,
              fontWeight: 300,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              lineHeight: 1.6,
              color: 'var(--hero-ink)',
            }}
          >
            <Reveal direction="up" delay={80}>
              <span className="block opacity-85">Every sprint,</span>
            </Reveal>
            <Reveal direction="up" delay={170}>
              <span className="ml-[6%] block text-[29px] leading-snug tracking-[0.02em]">
                One cinematic
              </span>
            </Reveal>
            <Reveal direction="up" delay={260}>
              <span className="ml-[18%] block opacity-85">
                Scroll <span aria-hidden="true" style={{ color: DOT }}>◆</span>
              </span>
            </Reveal>
          </Typography.Title>
          <Reveal direction="up" delay={320}>
            <p className="m-0 mt-6 max-w-[300px] text-[17px] leading-[1.5] text-[var(--hero-ink)] opacity-85">
              A task platform for engineering teams — sprint, saga and evidence in one
              continuous scroll.
            </p>
          </Reveal>
        </Parallax>
      </div>

      {/* ── CLICK ◆ ENTER — CTA thật giữa hero (ref), scroll mượt xuống chương 01 ── */}
      <div className="z-10 my-10 flex justify-center md:my-0 md:absolute md:left-1/2 md:top-[47%] md:block md:-translate-x-1/2 md:-translate-y-1/2">
        <Parallax speed={0.5} strength={280} disabled={!isMd}>
          <button
            type="button"
            onClick={enter}
            aria-label="Vào chương 01 — Deep focus"
            className="cursor-pointer border-none bg-transparent p-2 font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-[var(--hero-ink)] opacity-75 transition-opacity duration-150 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            click <span aria-hidden="true" style={{ color: DOT }}>◆</span> enter
          </button>
        </Parallax>
      </div>

      {/* ── CHIP DỮ LIỆU NỔI — 4 tốc độ parallax + Reveal stagger (chỉ lg+ để 375 sạch) ── */}
      {CHIPS.map((chip) => (
        <Parallax
          key={chip.label}
          speed={chip.speed}
          strength={280}
          className="pointer-events-none absolute inset-0 z-10 hidden lg:block"
        >
          <Reveal direction="up" delay={chip.delay} className={`absolute ${chip.pos}`}>
            <Chip spec={chip} />
          </Reveal>
        </Parallax>
      ))}

      {/* ── CỤM TRÁI DƯỚI — signup + mini-nav numbered + terms (ref bố cục) ── */}
      <div className="relative z-10 mt-10 max-md:px-6 md:absolute md:bottom-10 md:left-[clamp(228px,17vw,268px)]">
        {subscribed ? (
          <p role="status" className="m-0 font-mono text-[11px] font-bold uppercase tracking-[2.4px] text-[var(--hero-ink)] opacity-80">
            Đã ghi nhận
          </p>
        ) : (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSubscribed(true);
            }}
          >
            <label
              htmlFor="hero-email"
              className="font-mono text-[11px] font-bold uppercase tracking-[2.4px] text-[var(--hero-ink)] opacity-70"
            >
              Email đăng ký
            </label>
            <input
              id="hero-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 w-48 rounded-lg border border-line bg-transparent px-2 text-[12px] text-[var(--hero-ink)] outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
            <Button size="small" htmlType="submit" aria-label="Gửi">
              Gửi
            </Button>
          </form>
        )}

        <nav aria-label="Chương (mini-nav)" className="mt-3 hidden items-center gap-4 md:flex">
          {EXPERIENCE_CHAPTERS.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="font-mono text-[11px] font-bold tracking-[2.64px] text-[var(--hero-ink)] opacity-60 no-underline transition-opacity duration-150 hover:opacity-100"
            >
              {c.num} · {c.title}
            </a>
          ))}
        </nav>
      </div>

      {/* ── SCROLL HINT — progress ring + chevron (infinite CHỈ trạng thái affordance) ── */}
      <div className="z-10 my-8 flex flex-col items-center gap-1 max-md:mx-auto md:my-0 md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2">
        <ProgressRing progress={heroPct} />
        <Icon
          name="angle-double-right"
          size={12}
          className={`text-[var(--hero-ink)] opacity-60 rotate-90 ${reduced ? '' : 'animate-bounce'}`}
        />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[2.4px] text-[var(--hero-ink)] opacity-70">
          Cuộn
        </span>
      </div>

      {/* ── THUMBNAIL TRAILER phải dưới (ref) — mở cùng Modal ── */}
      <button
        type="button"
        onClick={() => setTrailer(true)}
        aria-label="Xem trailer — Season patch"
        className="absolute bottom-14 right-[clamp(24px,5.3vw,68px)] z-10 hidden cursor-pointer overflow-hidden rounded-md border shadow-lift lg:block"
        style={{ borderColor: 'rgba(16, 36, 52, 0.25)' }}
      >
        <img
          src="https://picsum.photos/seed/wakii-trailer-cover/420/240"
          alt=""
          className="block h-[120px] w-[210px] object-cover"
        />
        <span className="absolute inset-x-0 bottom-0 bg-[var(--scrim-3)] px-2 py-1 text-left text-[10px] font-bold uppercase tracking-[1.8px] text-white">
          Season patch — trailer
        </span>
      </button>

      <Modal
        open={trailer}
        title="Trailer — ORCA × WAKII"
        onCancel={() => setTrailer(false)}
        okText="Đóng"
        cancelText="Huỷ"
        onOk={() => setTrailer(false)}
      >
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <img
              key={n}
              src={`https://picsum.photos/seed/wakii-trailer-${n}/480/300`}
              alt={`Trailer frame ${n}`}
              className="w-full rounded-lg border border-line object-cover"
            />
          ))}
        </div>
        <p className="mb-0 mt-3 text-meta text-ink3">
          Demo frames (0-deps — không nhúng video). Trong app thật: chart sống + timeline sự kiện.
        </p>
      </Modal>
    </header>
  );
}
