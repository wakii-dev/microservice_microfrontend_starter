// HERO — ORCA × WAKII Cinematic Experience (owner @v2, contract v0.2 theo REF-SPEC).
// REF-SPEC (docs/team/ref/REF-SPEC.md — PO đo live 1280×800): hero có section nền
// SÁNG, chữ navy rgb(16,36,52) (--navy-ink token mới); H1 18px/300 LIGHT uppercase,
// line-break chủ động; display/buttons 12px/700 uppercase tracking 2.4px; body nhỏ
// 12px/400 tracking 0.3px. IP: sao chép SỐ ĐO + cấu trúc — nội dung Orca của ta.
// Starfield canvas 2D 3 lớp (near/mid/far, mouse-parallax nhẹ) — sao NAVY trên nền
// sáng (constellation blueprint); canvas fill đọc token --navy-ink runtime
// (ngoại lệ tokens ghi rõ: canvas 2D không qua className). reduced-motion: tĩnh.
import { useEffect, useRef, useState } from 'react';
import { Button, Icon, Modal, Typography, useMediaQuery } from '../../../index';

function Starfield({ reduced }: { reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Màu + độ nổi hạt theo theme (PO bugfix "nền đen sao đen"): light = navy
    // --navy-ink alpha nhẹ · dark = TRẮNG và ĐẬM hơn (alpha +0.4, r +0.3) — nếu
    // không, hạt trắng alpha 0.2 trên nền đen là vô hình.
    // Pattern watermark: đọc token runtime + MutationObserver data-bp-theme repaint.
    let ink = 'rgb(16, 36, 52)';
    let dark = false;
    const readTheme = () => {
      dark = document.documentElement.getAttribute('data-bp-theme') === 'dark';
      ink = dark
        ? 'rgba(255, 255, 255, 0.95)'
        : getComputedStyle(document.documentElement).getPropertyValue('--navy-ink').trim() || 'rgb(16, 36, 52)';
    };
    readTheme();

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const stars = Array.from({ length: 180 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: i % 3 === 0 ? 1.6 : i % 3 === 1 ? 1.1 : 0.7,
      a: i % 3 === 0 ? 0.55 : i % 3 === 1 ? 0.35 : 0.2,
      depth: i % 3 === 0 ? 22 : i % 3 === 1 ? 12 : 6,
    }));

    const draw = (mx = 0, my = 0) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        ctx.globalAlpha = dark ? Math.min(1, s.a + 0.5) : s.a;
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(s.x + mx * s.depth, s.y + my * s.depth, dark ? s.r + 0.5 : s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    draw(); // frame tĩnh — reduced-motion dừng ở đây

    if (reduced) {
      const onResize = () => {
        resize();
        draw();
      };
      window.addEventListener('resize', onResize);
      const themeObs = new MutationObserver(() => {
        readTheme();
        draw();
      });
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bp-theme'] });
      return () => {
        window.removeEventListener('resize', onResize);
        themeObs.disconnect();
      };
    }

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = canvas.getBoundingClientRect();
        if (r.width === 0) return;
        draw((e.clientX - r.left - r.width / 2) / r.width, (e.clientY - r.top - r.height / 2) / r.height);
      });
    };
    const onResize = () => {
      resize();
      draw();
    };
    const themeObs = new MutationObserver(() => {
      readTheme();
      draw();
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bp-theme'] });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      themeObs.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}

export default function Hero() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [trailer, setTrailer] = useState(false);

  return (
    <header
      id="hero"
      data-mood="atlas"
      className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden p-6 text-center"
      style={{ background: 'linear-gradient(to bottom, var(--hero-sky-a), var(--hero-sky-b))' }}
    >
      <Starfield reduced={reduced} />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <p className="m-0 text-[12px] font-bold uppercase tracking-[2.4px] text-[var(--navy-ink)]">
          ORCA × WAKII — cinematic experience
        </p>
        {/* REF-SPEC H1: 18px/300 LIGHT uppercase, line-break chủ động — KHÔNG bold to */}
        <Typography.Title
          level={1}
          className="!m-0 uppercase"
          style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.14em', color: 'var(--navy-ink)', lineHeight: 1.6 }}
        >
          Ship work, not tooling
          <br />
          một hệ tokens — năm chương chuyển động
        </Typography.Title>
        <p className="m-0 max-w-md text-[12px] tracking-[0.3px] text-ink2">
          Năm chương, một hệ tokens — câu chuyện được kể bằng chuyển động.
        </p>
        <Button
          type="default"
          size="large"
          icon={<Icon name="eye" size={14} />}
          onClick={() => setTrailer(true)}
          className="uppercase"
        >
          <span className="text-[12px] font-bold uppercase tracking-[2.4px]">Watch the trailer</span>
        </Button>
      </div>

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
