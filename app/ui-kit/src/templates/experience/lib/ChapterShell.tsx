// ChapterShell — khung chương SF-3 theo EXPERIENCE-DESIGN.md v1.0: label mono
// 'CHƯƠNG 0X' 11px/700 tracking 2.64px + title ALL-CAPS ~29px/300 leading-snug
// tracking 0.02em + copy punchy 2 dòng (body 12px/400 tracking 0.3 leading 1.7)
// + parallax nền gần-fixed speed 0.08 / strength 280 (§4 — layer vignette trôi,
// KHÔNG đục: màu mood do MoodBackdrop crossfade page-wide lo, §2 — cùng kiến
// trúc mood-engine; ch1 chú thích "KHÔNG tự đặt nền đặc"). Section contract §6:
// relative min-h-screen + id + data-mood. Theme-independent qua white-alpha cố
// định (§6 — KHÔNG token flip); band sáng (mood 'future') dùng tone="light" →
// ink theme-flip đúng bảng ink §2.
import type { ReactNode } from 'react';
import { Parallax } from '../../../index';

/** Ink theo tone — dark: white-alpha cố định trên nền tối tự chủ; light: token
 * theme-flip trên band sáng (contract §2 mood 'future' ink --ink). */
const TONE = {
  dark: { label: 'text-white/85', title: 'text-white', copy: 'text-white/92' },
  light: { label: 'text-ink3', title: 'text-ink', copy: 'text-ink2' },
} as const;

export interface ChapterShellProps {
  /** id anchor của chương: ch1..ch5 (SideNav scroll-spy trỏ về đây). */
  id: string;
  /** Số chương hiển thị trên label mono: '01'..'05'. */
  chapter: string;
  /** data-mood cho ranh giới crossfade (focus/docs/velocity/ship/future…). */
  mood: string;
  /** Title chương — data gốc; ALL-CAPS là CSS uppercase (REF-SPEC H2 ~29px/300). */
  title: string;
  /** Copy punchy ~2 dòng dưới title. */
  copy: string;
  /** Ink của chương: 'dark' (mặc định — nền tối) | 'light' (band sáng mood future). */
  tone?: keyof typeof TONE;
  /** Nội dung riêng của chương (parallax ảnh, cards, counter…). */
  children?: ReactNode;
  className?: string;
}

export function ChapterShell({
  id,
  chapter,
  mood,
  title,
  copy,
  tone = 'dark',
  children,
  className,
}: ChapterShellProps) {
  const ink = TONE[tone];
  return (
    <section
      id={id}
      data-mood={mood}
      data-tone={tone}
      className={`relative min-h-screen overflow-hidden ${className ?? ''}`}
    >
      {/* Nền chương gần-fixed (§4: chapter BG parallax speed 0.08 / strength 280) —
       * vignette alpha LOW để crossfade MoodBackdrop phía sau vẫn lộ trọn. Layer cao
       * hơn section (inset âm) để trôi không hở mép; overflow-hidden của section cắt. */}
      <Parallax speed={0.08} strength={280} className="absolute -inset-y-16 inset-x-0">
        <div
          data-chapter-bg=""
          aria-hidden="true"
          className="h-full w-full bg-[linear-gradient(180deg,transparent_40%,var(--scrim-2)_100%)]"
        />
      </Parallax>

      {/* Content rail §3: max-w-5xl px-10 (max-md px-6) · padding chương py-16. */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-10 py-16 max-md:px-6">
        {/* Label mono — 11px/700 UPPERCASE tracking 2.64px (§1); nhạt white/85
         * (REF-SPEC rgb(220,225,236) trên nền tối). */}
        <p className={`m-0 font-mono text-[11px] font-bold uppercase tracking-[2.64px] ${ink.label}`}>
          Chương {chapter}
        </p>
        {/* Title — 29px/300 LIGHT leading-snug tracking 0.02em (§1 H2 chapter). */}
        <h2 className={`m-0 mt-3 text-[29px] font-light uppercase leading-snug tracking-[0.02em] ${ink.title}`}>
          {title}
        </h2>
        {/* Copy punchy 2 dòng — body 12px/400 tracking 0.3px leading 1.7 (§1). */}
        <p className={`mb-0 mt-4 max-w-prose text-[12px] leading-[1.7] tracking-[0.3px] ${ink.copy}`}>{copy}</p>
        {children}
      </div>
    </section>
  );
}
