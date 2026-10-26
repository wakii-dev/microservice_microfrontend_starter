// ScrollPage — container fullpage scroll-snap kiểu antd/landing page (composite
// pattern antd: ScrollPage.Section): CSS scroll-snap-type y mandatory — 0 JS
// scroll-hijack, native momentum giữ nguyên. Chiều cao theo VIEWPORT CỦA
// CONTAINER: container h-screen; mỗi Section snap-start + min-h-full (100% của
// container — không hardcode 100vh nên đặt trong panel/layout khác vẫn snap đúng).
// Tokens-only; keyboard: container focusable (tabIndex 0) → mũi tên cuộn snap
// như native; Section là <section> có id + aria-label (landmark).
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/dom.js';

export interface ScrollPageProps extends HTMLAttributes<HTMLDivElement> {
  /** Nội dung — nên gồm toàn `ScrollPage.Section`. */
  children?: ReactNode;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: ScrollPageClassNames;
}

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface ScrollPageClassNames {
  /** Div container snap deck (h-screen, focusable). */
  root?: string;
}

/** Slot classes cho Section — merge sau class mặc định (consumer append). */
export interface ScrollPageSectionClassNames {
  /** <section> full-height snap-start. */
  root?: string;
}

export interface ScrollPageSectionProps extends HTMLAttributes<HTMLElement> {
  /** id + aria-label khuyến nghị cho điều hướng/landmark. */
  children?: ReactNode;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: ScrollPageSectionClassNames;
}

/** Một "trang" full-height — snap về đúng khung khi cuộn. */
export function ScrollPageSection({ className, classNames, children, ...rest }: ScrollPageSectionProps) {
  return (
    <section
      className={cx('flex min-h-full snap-start flex-col items-center justify-center px-6 py-12', classNames?.root, className)}
      {...rest}
    >
      {children}
    </section>
  );
}

function ScrollPageRoot({ className, classNames, children, ...rest }: ScrollPageProps) {
  return (
    <div
      tabIndex={0}
      className={cx(
        'h-screen snap-y snap-mandatory overflow-y-auto overflow-x-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        classNames?.root,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** ScrollPage + ScrollPage.Section — composite component pattern antd. */
export const ScrollPage = Object.assign(ScrollPageRoot, { Section: ScrollPageSection });

/** Kiểu component composite — barrel khai báo type kèm khi re-export. */
export type ScrollPageComponent = typeof ScrollPage;
