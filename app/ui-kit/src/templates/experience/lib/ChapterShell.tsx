// ChapterShell — khung chương dùng chung cinematic experience (SF-3): label mono
// 'CHƯƠNG 0X' 11px/700 tracking 2.64 + title ~29px/300 ALL-CAPS + copy punchy 2 dòng
// + parallax nền gần-fixed (speed 0.08 / strength 280) + section TỰ CHỦ gradient tối
// theme-independent (scrim tokens + bg-black — dark đúng cả khi theme cascade sáng).
// REF-SPEC: H2 ~29px/300 LIGHT, label 11px/700 tracking 2.64, body 12px/400 tracking 0.3.
// Contract: section id + data-mood cho mood crossfade của shell; children = nội dung
// riêng của từng chương (parallax ảnh/card tuỳ chương tự đặt bên trong children).
import type { ReactNode } from 'react';
import { Parallax } from '../../../index';

export interface ChapterShellProps {
  /** id anchor của chương: ch1..ch5 (SideNav scroll-spy trỏ về đây). */
  id: string;
  /** Số chương hiển thị trên label mono: '01'..'05'. */
  chapter: string;
  /** data-mood cho ranh giới crossfade (focus/docs/velocity/ship/future…). */
  mood: string;
  /** Title ALL-CAPS — render 29px/300 LIGHT (REF-SPEC: wow nằm ở scene, không cỡ chữ). */
  title: string;
  /** Copy punchy ~2 dòng dưới title. */
  copy: string;
  /** Nội dung riêng của chương (parallax ảnh, cards, counter…). */
  children?: ReactNode;
  className?: string;
}

export function ChapterShell({ id, chapter, mood, title, copy, children, className }: ChapterShellProps) {
  return (
    <section
      id={id}
      data-mood={mood}
      className={`relative min-h-screen overflow-hidden bg-black text-white ${className ?? ''}`}
    >
      {/* Nền TỰ CHỦ — gradient tối qua scrim tokens (theme-independent: dark kể cả khi
       * theme cascade sáng). Parallax gần-fixed speed 0.08 / strength 280; layer cao
       * hơn section (inset âm) để trôi không hở mép. */}
      <Parallax speed={0.08} strength={280} className="absolute -inset-y-16 inset-x-0">
        <div
          data-chapter-bg=""
          aria-hidden="true"
          className="h-full w-full bg-[linear-gradient(180deg,var(--scrim-3),var(--scrim-4))]"
        />
      </Parallax>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-[clamp(24px,5.3vw,68px)] py-24">
        {/* Label mono — 11px/700 uppercase tracking 2.64px (REF-SPEC) */}
        <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-white/60">
          Chương {chapter}
        </p>
        {/* Title ALL-CAPS — ~29px/300 LIGHT: wow nằm ở scene, không cỡ chữ (REF-SPEC) */}
        <h2 className="m-0 mt-3 text-[29px] font-light uppercase leading-tight tracking-[0.06em] text-white">
          {title}
        </h2>
        {/* Copy punchy 2 dòng — body 12px/400 tracking 0.3px */}
        <p className="mb-0 mt-4 max-w-prose text-[12px] tracking-[0.3px] text-white/60">{copy}</p>
        {children}
      </div>
    </section>
  );
}
