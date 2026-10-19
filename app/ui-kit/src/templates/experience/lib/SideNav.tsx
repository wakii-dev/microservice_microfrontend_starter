// SideNav — single-source side-nav của cinematic experience (SF-3, bài học overlap:
// CHỈ 1 nguồn render nav — số mono + title CÙNG flow dòng flex items-baseline, hết
// layer 'CHƯƠNG 0X' riêng đè title). Wrapper fixed pointer-events-none + nav
// pointer-events-auto — không che tương tác chương. Scroll-spy do Anchor đảm nhiệm
// (aria-current + dot accent); offsetTop 0 theo hội đồng (shell header là overlay).
// REF-SPEC: label 11px/700 UPPERCASE tracking 2.64px màu nhạt ≈ text-white/85.
import type { JSX } from 'react';
import { Anchor } from '../../../index';

export interface ExperienceChapter {
  id: string;
  num: string;
  title: string;
}

/** 5 chương experience — nguồn danh sách dùng chung (nav + footer lặp + compose).
 * (data của chính nav — precedent DRAG_MIME drag-drop, nên ở cùng file.) */
// eslint-disable-next-line react-refresh/only-export-components
export const EXPERIENCE_CHAPTERS: ExperienceChapter[] = [
  { id: 'ch1', num: '01', title: 'Deep focus' },
  { id: 'ch2', num: '02', title: 'Living docs' },
  { id: 'ch3', num: '03', title: 'Team velocity' },
  { id: 'ch4', num: '04', title: 'Ship your app' },
  { id: 'ch5', num: '05', title: 'Future' },
];

/** Rail nav trái — fixed, ẩn < md (mobile progress là việc của shell mood provider). */
export function SideNav(): JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-y-0 left-6 z-[var(--z-popover)] hidden w-44 items-center md:flex">
      <nav aria-label="Chương" className="pointer-events-auto">
        <Anchor
          offsetTop={0}
          items={EXPERIENCE_CHAPTERS.map((c) => ({
            href: `#${c.id}`,
            title: (
              <span className="flex items-baseline gap-2">
                <span
                  aria-hidden="true"
                  className="font-mono text-[11px] font-bold tracking-[2.64px] text-white/60"
                >
                  {c.num}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[2.64px] text-white/85">
                  {c.title}
                </span>
              </span>
            ),
          }))}
        />
      </nav>
    </div>
  );
}
