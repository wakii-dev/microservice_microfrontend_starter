// SideNav — single-source side-nav cinematic experience (SF-3).
// REDESIGN theo PO 2026-10-19 — rail tối giản cao cấp kiểu glass (thay look list
// thường của Anchor — Anchor không express được glass/pill/progress nên rail tự
// render, giữ nguyên triết lý: 1 nguồn dữ liệu EXPERIENCE_CHAPTERS, CHỈ 1 scroll-spy,
// aria-current + keyboard qua <a> thật):
//   1) rail dọc trái GLASS: canvas/70 + backdrop-blur + hairline phải (không hộp card)
//   2) item: dot tròn nhỏ + mono số + label ngắn ALL-CAPS tracking 2.64; ACTIVE = text
//      accent + dot accent + translate-x nhẹ (transition 200ms — UI micro §4)
//   3) hover: label/dot sáng dần — KHÔNG đổi bg
//   4) mobile <768: dot-nav đáy cố định — 5 dot, active thành pill accent + label ngắn
//   5) scroll progress 2px chạy dọc rail theo % trang (accent, rAF qua usePageProgress)
// Ink = THEME token (ink3/ink2) — glass là bề mặt theme (canvas/70 + blur), KHÔNG
// theo mood chương: token flip tự ăn 2 theme, trắng-alpha theo mood sẽ mất contrast
// trên glass sáng. a11y: nav landmark duy nhất, aria-current 2 variant, focus ring,
// no-underline (preflight tắt), reduced-motion → nhảy tức thì.
import { useEffect, useState } from 'react';
import type { JSX, MouseEvent as ReactMouseEvent } from 'react';
import { useMediaQuery } from '../../../hooks/useMediaQuery.js';
import { usePageProgress } from './scroll-mood.js';

export interface ExperienceChapter {
  id: string;
  num: string;
  /** Title đầy đủ (footer nav lặp dùng). */
  title: string;
  /** Label ngắn cho rail/dot-nav (PO: label ngắn ALL-CAPS — uppercase là CSS). */
  short: string;
}

/** 5 chương experience — nguồn danh sách dùng chung (nav + footer lặp + compose).
 * (data của chính nav — precedent DRAG_MIME drag-drop, nên ở cùng file.) */
// eslint-disable-next-line react-refresh/only-export-components
export const EXPERIENCE_CHAPTERS: ExperienceChapter[] = [
  { id: 'ch1', num: '01', title: 'Deep focus', short: 'Focus' },
  { id: 'ch2', num: '02', title: 'Living docs', short: 'Docs' },
  { id: 'ch3', num: '03', title: 'Team velocity', short: 'Velocity' },
  { id: 'ch4', num: '04', title: 'Ship your app', short: 'Ship' },
  { id: 'ch5', num: '05', title: 'Future', short: 'Future' },
];

/** Nav chrome experience — desktop glass rail trái + mobile dot-nav đáy (1 landmark). */
export function SideNav(): JSX.Element {
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const pct = usePageProgress();

  useEffect(() => {
    let raf = 0;
    const sync = () => {
      raf = 0;
      // Section cuối có đỉnh chạm mép viewport → active (thuật toán offsetTop 0 —
      // cùng语义 Anchor).
      let current: string | undefined;
      for (const c of EXPERIENCE_CHAPTERS) {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= 1) current = c.id;
      }
      setActiveId(current);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    sync();
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const go = (e: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="Chương">
      {/* DESKTOP (md+) — glass rail trái: canvas/70 + blur + hairline phải */}
      <div className="pointer-events-none fixed inset-y-0 left-0 z-[var(--z-popover)] hidden md:block">
        <div
          className="pointer-events-auto relative flex h-full w-40 flex-col justify-center gap-1 border-r border-line py-6 pl-6 pr-3 backdrop-blur-md"
          style={{ background: 'color-mix(in srgb, var(--c-canvas) 70%, transparent)' }}
        >
          {/* Scroll progress 2px chạy dọc rail theo % trang */}
          <div
            data-nav-progress=""
            aria-hidden="true"
            className="absolute left-0 top-0 w-0.5 bg-accent"
            style={{ height: `${Math.round(pct * 100)}%` }}
          />
          {EXPERIENCE_CHAPTERS.map((c) => {
            const isActive = activeId === c.id;
            return (
              <a
                key={c.id}
                href={`#${c.id}`}
                aria-current={isActive || undefined}
                onClick={(e) => go(e, c.id)}
                className={`group flex items-center gap-2.5 rounded-lg py-1.5 no-underline outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  isActive ? 'translate-x-1' : 'translate-x-0'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full transition-all duration-200 ${
                    isActive ? 'scale-100 bg-accent' : 'scale-75 bg-ink4 group-hover:scale-90'
                  }`}
                />
                <span
                  aria-hidden="true"
                  className={`font-mono text-[11px] font-bold tracking-[2.64px] transition-colors duration-200 ${
                    isActive ? 'text-accent' : 'text-ink3'
                  }`}
                >
                  {c.num}
                </span>
                <span
                  className={`text-[11px] font-bold uppercase tracking-[2.64px] transition-colors duration-200 ${
                    isActive ? 'text-accent' : 'text-ink2 group-hover:text-ink'
                  }`}
                >
                  {c.short}
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* MOBILE (<768) — dot-nav đáy: 5 dot, active mở thành pill accent + label ngắn */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-popover)] md:hidden">
        <div
          className="pointer-events-auto flex h-14 items-center justify-center gap-4 border-t border-line px-4 backdrop-blur-md"
          style={{ background: 'color-mix(in srgb, var(--c-canvas) 70%, transparent)' }}
        >
          {EXPERIENCE_CHAPTERS.map((c) => {
            const isActive = activeId === c.id;
            return (
              <a
                key={c.id}
                href={`#${c.id}`}
                aria-current={isActive || undefined}
                onClick={(e) => go(e, c.id)}
                aria-label={c.title}
                className={`flex items-center gap-1.5 rounded-pill no-underline outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  isActive ? 'bg-accent/10 px-3 py-1.5' : 'p-1.5'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full transition-all duration-200 ${
                    isActive ? 'scale-100 bg-accent' : 'scale-75 bg-ink4 group-hover:scale-90'
                  }`}
                />
                <span
                  className={`font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-accent ${
                    isActive ? 'inline' : 'hidden'
                  }`}
                >
                  {c.short}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
