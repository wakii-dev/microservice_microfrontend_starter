// CHƯƠNG 01 · DEEP FOCUS — SF-4 (owner @w6, spec giàu-lớp PO: 5-7 layer thị giác,
// KHÔNG chỉ 1 heading + 1 con số). Contract EXPERIENCE-DESIGN.md v1.0 + ChapterShell
// (SF-3 glass-nav — KHÔNG tự đặt nền đặc: màu mood do MoodBackdrop page-wide lo).
//
// Layer map: (1) shell parallax vignette · (2) ghost 62.210 mờ nền (Parallax
// lớp-giữa) · (3) blueprint annotation mono aria-hidden · (4) split 7/5 — trái
// heading split-text + editorial + CTA · (5) focus stack 3 card lệch chồng, mỗi
// card Parallax tốc độ khác · (6) stat strip 4 mini CountUp · (7) split-text
// reveal từng chữ (vocabulary §4 — template-local).
// Motion CHỈ vocabulary §4: Parallax / Reveal / CountUp / split-text / micro
// 150-250ms; infinite chỉ con trỏ typing (trạng thái); reduced-motion tự tắt.
import { useEffect, useRef, useState } from 'react';
import { CountUp, Parallax } from '../../../index';
import { ChapterShell } from '../lib/ChapterShell.js';

/* ── Split-text reveal — template-local (§4: split-text reveal | ch1) ──
 * Chữ hiện lần lượt khi vào viewport (IntersectionObserver 1 lần); reduced-motion
 * → IO absent/global block → chữ hiện tĩnh (không phụ thuộc animation forwards). */
function SplitText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <span ref={ref} data-split-text="" aria-label={text} className="inline-flex flex-wrap">
      {[...text].map((ch, i) =>
        ch === ' ' ? (
          <span key={i} aria-hidden="true" className="w-[0.35em]" />
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className={`inline-block ${shown ? 'animate-[bp-slide-up-in_600ms_var(--ease-enter)_backwards]' : 'opacity-0'}`}
            style={shown ? { animationDelay: `${80 + i * 45}ms` } : undefined}
          >
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

/* ── Live timer — CountUp chạy liên tục theo giây thật (state 1s/lần, CountUp
 * ease 0.4s từ giá trị đang hiện → đích mới; reduced-motion vẫn tick — đây là
 * dữ liệu live, không phải animation trang trí). */
function LiveTimer() {
  const [sec, setSec] = useState(14 * 60 + 32);
  useEffect(() => {
    const t = setInterval(() => setSec((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span data-live-timer="" className="text-3xl font-bold tabular-nums text-white">
      <CountUp value={sec} duration={0.4} format={(n) => `${Math.floor(n / 60)}:${String(Math.round(n) % 60).padStart(2, '0')}`} />
    </span>
  );
}

/* ── Typing effect — code mono gõ từng ký tự khi vào viewport; con trỏ ▌
 * animate-pulse = infinite CHỈ trạng thái (§4). Reduced-motion → hiện đầy đủ. */
function TypeCode({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(text.length);
      return;
    }
    const t = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(t);
          return v;
        }
        return v + 1;
      });
    }, 34);
    return () => clearInterval(t);
  }, [text]);
  return (
    <span data-typing-code="" className="font-mono text-label leading-[1.7] text-white/85">
      {text.slice(0, n)}
      <span aria-hidden="true" className="animate-pulse text-accent">▌</span>
    </span>
  );
}

const STATS: Array<{ value: number; label: string; suffix?: string }> = [
  { value: 128, label: 'Block hôm nay' },
  { value: 9, label: 'Ngày streak' },
  { value: 42, label: 'Phút — block dài nhất' },
  { value: 96, label: 'Depth trung bình', suffix: '%' },
];

/** CHƯƠNG 01 — Deep focus. Layer 2-7 bên dưới; layer 1 (vignette parallax) là shell. */
export default function Ch1DeepFocus() {
  return (
    <ChapterShell
      id="ch1"
      chapter="01"
      mood="focus"
      title="Deep focus"
      copy="Tập trung không phải cảm hứng — đó là hạ tầng: block thời gian, worklog tự động, và một con số bạn tin được."
    >
      {/* LAYER 2 — ghost 62.210 mờ nền, Parallax lớp-giữa (§4 speed 0.3/strength 240),
       * tracking âm số lớn (§1 typography-depth −0.02em). */}
      <Parallax speed={0.3} strength={240} className="pointer-events-none absolute inset-x-0 top-[8%]">
        <p
          data-ghost-number=""
          aria-hidden="true"
          className="m-0 select-none text-center text-[clamp(6rem,18vw,15rem)] font-light leading-none tabular-nums tracking-[-0.02em] text-white/[0.06]"
        >
          62.210
        </p>
      </Parallax>

      {/* LAYER 3 — blueprint annotation mono (decor, aria-hidden §6). */}
      <p
        data-blueprint-note=""
        aria-hidden="true"
        className="absolute right-0 top-[4%] m-0 hidden border-r-2 border-white/15 pr-2 text-right font-mono text-[10px] uppercase leading-[1.6] tracking-[2px] text-white/40 md:block"
      >
        Fig. 01 — focus hours
        <br />
        logged via worklog
      </p>
      <p
        data-blueprint-note=""
        aria-hidden="true"
        className="absolute bottom-[26%] left-0 m-0 hidden border-l-2 border-white/15 pl-2 font-mono text-[10px] uppercase leading-[1.6] tracking-[2px] text-white/40 md:block"
      >
        62.210 giờ tập trung
        <br />
        cộng dồn toàn sprint
      </p>

      {/* LAYER 4+5 — split 7/5 (§3 grid chapter md:grid-cols-2 gap-8 items-center;
       * 7/5 qua col-span). Trái: heading split-text + editorial + CTA. Phải: focus stack. */}
      <div className="relative z-10 mt-10 grid items-center gap-10 md:grid-cols-12 md:gap-8">
        {/* TRÁI (7) */}
        <div className="md:col-span-7">
          <h3 className="m-0 font-mono text-[clamp(1.15rem,2.6vw,1.7rem)] font-bold uppercase leading-[1.4] tracking-[0.14em] text-white">
            <SplitText text="TẬP TRUNG LÀ HẠ TẦNG" />
          </h3>
          {/* Hero editorial đoạn — 17px/400 leading 1.5, cụm trái KHÔNG caps (§1). */}
          <p className="mt-6 max-w-lg text-[17px] leading-[1.5] text-white/85">
            Mỗi block tập trung đều được log vào worklog — không tự khai, không ước lượng.
            Orca đếm hộ, bạn chỉ việc ngồi vào.
          </p>
          {/* CTA thật (§6) — nút sáng chữ tối (REF-SPEC: CTA chữ tối trên nút sáng,
           * display 12px/700 uppercase tracking 2.4px). */}
          <a
            href="#ch2"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[12px] font-bold uppercase tracking-[2.4px] text-[color:var(--hero-ink)] transition-[box-shadow,transform] duration-200 ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)] active:translate-y-px focus-visible:ring-[3px] focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            Xem chương 02
            <span aria-hidden="true">↓</span>
          </a>
        </div>

        {/* PHẢI (5) — focus stack 3 card lệch chồng, mỗi card Parallax tốc độ khác
         * (§4 họ lớp-giữa speed ≤0.3). White-alpha cố định trên nền tối (§6). */}
        <div className="relative md:col-span-5">
          <div data-focus-card="" className="relative z-10 mr-10 rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <p className="m-0 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[2px] text-white/60">
              <span aria-hidden="true" className="size-2 rounded-pill bg-st-doing" />
              Đang tập trung
            </p>
            <p className="mb-0 mt-2 text-body font-semibold text-white">ORC-241 · Tách module auth khỏi core</p>
          </div>
          <div data-focus-card="" className="relative z-20 -mt-3 ml-8 rounded-xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-sm">
            <LiveTimer />
            <p className="m-0 mt-1 font-mono text-[10px] font-bold uppercase tracking-[2px] text-white/60">
              Phiên đang chạy — live
            </p>
          </div>
          <div data-focus-card="" className="relative z-30 -mt-3 mr-4 rounded-xl border border-white/10 bg-[rgb(10,12,22)]/85 p-4 backdrop-blur-sm">
            <TypeCode text="$ orca worklog push --focus 25m ✓ logged" />
          </div>
        </div>
      </div>

      {/* LAYER 6 — stat strip 4 mini CountUp (§1 meta số: 3xl bold tabular-nums;
       * CountUp duration 1.2 vi-VN §4). */}
      <div className="relative z-10 mt-14 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} data-stat="" className="grid gap-1">
            <span data-stat-value="" className="text-3xl font-bold tabular-nums text-white">
              <CountUp value={s.value} format={(n) => `${n.toLocaleString('vi-VN')}${s.suffix ?? ''}`} />
            </span>
            <span data-stat-label="" className="font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-white/60">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </ChapterShell>
  );
}
