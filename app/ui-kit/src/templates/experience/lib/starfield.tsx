// Starfield — canvas 2D theme-aware của hero Cinematic Experience (SF-2): chấm sao
// mảnh kiểu "constellation blueprint" trên nền sáng (màu đọc token --navy-ink tại
// host = navy rgb(16,36,52)); theme dark → --navy-ink override #f7f8f8 ⇒ "bông tuyết"
// light (10% hạt vẽ 6 cánh tuyết thay dot). rAF drift + twinkle nhẹ — infinite CHỈ
// trạng thái (contract EXPERIENCE-DESIGN §4); tab ẩn → pause; reduced-motion → 1
// frame tĩnh (không loop). Seed PRNG deterministic — cùng seed + cùng khổ = cùng bố
// cục (soi/test ổn định). jsdom/test thiếu 2d context → render rỗng, không crash.
import { useEffect, useRef, type CanvasHTMLAttributes } from 'react';

export interface StarfieldProps
  extends Pick<CanvasHTMLAttributes<HTMLCanvasElement>, 'className'> {
  /** Hệ số mật độ (1 ≈ 1 sao/9000px² — hero 1280×800 ≈ 114 hạt). */
  density?: number;
  /** Seed PRNG — cùng seed + cùng khổ = cùng bố cục. */
  seed?: number;
}

/** mulberry32 — PRNG 32-bit deterministic (không phụ thuộc Math.random). */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Particle {
  /** Vị trí chuẩn hoá 0..1 (resize giữ tỷ lệ bố cục). */
  x: number;
  y: number;
  r: number;
  /** Alpha cơ bản 0.25..0.8. */
  a: number;
  /** Pha + tốc độ twinkle (rad/s). */
  phase: number;
  tw: number;
  /** Trôi lên chậm (đơn vị y/s). */
  drift: number;
  /** 10% hạt — vẽ 6 cánh tuyết thay dot. */
  sparkle: boolean;
}

/** Đọc --navy-ink computed tại host (light: navy — dark: override #f7f8f8). */
function resolveInk(host: HTMLElement): [number, number, number] {
  const m = getComputedStyle(host).getPropertyValue('--navy-ink').match(/\d+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [16, 36, 52];
}

/** Theme observer — data-bp-theme có thể đặt ở <html> HOẶC node bao (pattern
 * Scene3D observeTheme; addon-themes đặt trên body preview). */
function observeTheme(host: HTMLElement, onChange: () => void): () => void {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bp-theme', 'class'] });
  if (document.body) {
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-bp-theme'], subtree: true });
  }
  void host;
  return () => obs.disconnect();
}

export function Starfield({ density = 1, seed = 7, className }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom/test hoặc canvas bị chặn — render rỗng, không crash

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rnd = mulberry32(seed);
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let ink: [number, number, number] = resolveInk(canvas);
    let raf = 0;

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      const count = Math.round(((w * h) / 9000) * density);
      particles = Array.from({ length: count }, () => ({
        x: rnd(),
        y: rnd(),
        r: 0.5 + rnd() * 1.1,
        a: 0.25 + rnd() * 0.55,
        phase: rnd() * Math.PI * 2,
        tw: 0.4 + rnd() * 1.2,
        drift: 0.004 + rnd() * 0.01,
        sparkle: rnd() < 0.1,
      }));
      // Số đo verify (lead paste) + assertion test
      canvas.dataset.starfieldCount = String(count);
    };

    const draw = (t: number) => {
      const time = t / 1000;
      const [cr, cg, cb] = ink;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        const y = (((p.y - p.drift * time) % 1) + 1) % 1;
        const x = p.x + Math.sin(time * 0.15 + p.phase) * 0.004;
        const alpha = Math.max(0, p.a * (0.7 + 0.3 * Math.sin(time * p.tw + p.phase)));
        ctx.globalAlpha = alpha;
        if (p.sparkle) {
          // Bông tuyết 6 cánh — 3 đường kính xoay 60°
          const len = p.r * 3.2;
          ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
          ctx.lineWidth = 1;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const ang = (Math.PI / 3) * i + Math.PI / 6;
            const dx = Math.cos(ang) * len;
            const dy = Math.sin(ang) * len;
            ctx.moveTo(x * w - dx, y * h - dy);
            ctx.lineTo(x * w + dx, y * h + dy);
          }
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx.beginPath();
          ctx.arc(x * w, y * h, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && !reduced.matches && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onReduced = () => {
      stop();
      draw(0); // frame tĩnh đẹp ở cả 2 chế độ
      start();
    };
    const onResize = () => {
      build();
      if (reduced.matches) draw(0);
    };
    const onTheme = () => {
      ink = resolveInk(canvas);
      if (reduced.matches) draw(0); // đang chạy: frame kế tự dùng màu mới
    };

    build();
    if (reduced.matches) draw(0);
    else start();

    reduced.addEventListener('change', onReduced);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    const offTheme = observeTheme(canvas, onTheme);
    return () => {
      stop();
      reduced.removeEventListener('change', onReduced);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      offTheme();
    };
  }, [density, seed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-starfield=""
      className={className}
    />
  );
}
