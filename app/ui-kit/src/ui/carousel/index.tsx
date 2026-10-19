// Carousel — Swiper engine (peer-dep: consumer tự cài swiper khi dùng subpath này).
// Touch/drag momentum + loop + autoplay + keyboard + a11y — Swiper strengths.
// API giữ tinh thần PrimeReact Carousel (circular/autoplay/indicators/orientation).
//
// Navigators custom — WHY không dùng Navigation module binding: swiper/react v14
// init Swiper NGAY TRONG RENDER (initSwiper() lúc render, trước commit) nên refs
// tới nút custom luôn null lúc onBeforeInit/beforeInit → pattern
// navigation={{ prevEl, nextEl }} + re-assign trong onBeforeInit (docs chính thức
// cho bản cũ) KHÔNG còn hoạt động → nút chết (bug đã sửa 2026-10-17). Giải pháp:
// giữ <button> accessible của ta, onClick gọi thẳng instance slidePrev/slideNext
// (lấy qua onSwiper — chạy layout-effect sau mount). slidePrev/slideNext là core
// API, không cần Navigation module. Đầu/cuối (non-loop): mờ nút qua isBeginning/
// isEnd — Swiper tự guard không trượt quá, không cần attr disabled.
//
// onSlideChange dùng realIndex — loop mode activeIndex lệch offset slide clone.
//
// KHÔNG setState từ swiper events: swiper/react so params theo reference mỗi
// re-render — object config mới = changedParams → updateSwiper churn/re-init
// (realIndex reset, loop setState ở vertical). Edge-state (đầu/cuối non-loop)
// nên toggle imperative qua classList trên ref nút — không re-render.
import { useMemo, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import { Icon } from '../icons/index.js';
// CSS swiper đã chuyển sang src/entries/carousel.ts (subpath '@wakii/ui-kit/carousel') —
// barrel chính '@wakii/ui-kit' không kéo CSS nặng nữa (batch ⑩ 2026-10-18).

export interface CarouselProps {
  /** Slide contents — mỗi phần tử 1 slide (key React nên đặt). */
  items: React.ReactNode[];
  /** Loop qua cuối về đầu (swiper loop mode). */
  circular?: boolean;
  /** Tự chạy — swiper Autoplay (config memo theo reference, xem note đầu file). */
  autoplay?: boolean;
  /** Delay mỗi slide ms (default 4000). */
  autoplayInterval?: number;
  /** Dừng autoplay khi hover (swiper pauseOnMouseEnter). */
  pauseOnHover?: boolean;
  /** Indicators dưới — ô vuông Pagination-style (số trang, click slideTo). */
  indicators?: boolean;
  /** Nút prev/next custom (ẩn khi items ≤ 1; mờ ở đầu/cuối non-loop). */
  navigators?: boolean;
  /** Điều khiển bàn phím ← → ↑ ↓ (swiper Keyboard). */
  keyboard?: boolean;
  /** Số slide mỗi view (default 1). */
  itemsPerView?: number;
  /** Chiều trượt (default horizontal). */
  orientation?: 'horizontal' | 'vertical';
  /** Callback mỗi lần đổi slide — nhận realIndex (loop-safe). */
  onSlideChange?: (index: number) => void;
  /** Chiều cao container (bắt buộc thực tế cho vertical — default 300px). */
  height?: number | string;
  className?: string;
}

const BTN_CLS =
  'absolute z-10 top-1/2 -translate-y-1/2 cursor-pointer rounded-pill border-none bg-scrim-2 p-1.5 text-white outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-[background-color] duration-200 ease-[var(--ease-smooth)] hover:bg-scrim-3 active:bg-scrim-4';

// Indicator bullet — ngôn ngữ Pagination (ô vuông h-8 min-w-8 rounded-lg, SỐ TRANG
// trong ô). Active đổi bằng classList imperative (không setState từ swiper events —
// doctrine đầu file): border-none bg-accent font-medium text-white + aria-current.
// hover:bg-s3 chỉ nằm ở bộ INACTIVE — active bị hover đè (specificity :hover 0,2,0
// thắng utility 0,1,0) sẽ thành trắng-trên-trắng (bug đã bắt ở verify :6006).
const BULLET_CLS =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg text-body transition-colors duration-200 ease-[var(--ease-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';
const BULLET_INACTIVE = ['border', 'border-line', 'bg-transparent', 'text-ink', 'hover:bg-s3'];
const BULLET_ACTIVE = ['border-none', 'bg-accent', 'font-medium', 'text-white'];

export function Carousel({
  items,
  circular = false,
  autoplay = false,
  autoplayInterval = 4000,
  pauseOnHover = false,
  indicators = true,
  navigators = true,
  keyboard = true,
  itemsPerView = 1,
  orientation = 'horizontal',
  onSlideChange,
  height,
  className,
}: CarouselProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const bulletsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const navEnabled = navigators && items.length > 1;

  /** Active bullet — imperative qua classList + aria-current (doctrine: không
   * setState từ swiper events; same pattern syncEdge). */
  const syncActive = (s: SwiperInstance) => {
    bulletsRef.current.forEach((el, i) => {
      if (!el) return;
      const active = i === s.realIndex;
      for (const cls of BULLET_INACTIVE) el.classList.toggle(cls, !active);
      for (const cls of BULLET_ACTIVE) el.classList.toggle(cls, active);
      if (active) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  };

  // Memoize config objects — swiper/react so params theo reference (xem note đầu file).
  const autoplayConfig = useMemo(
    () =>
      autoplay
        ? { delay: autoplayInterval, disableOnInteraction: false, pauseOnMouseEnter: pauseOnHover }
        : false,
    [autoplay, autoplayInterval, pauseOnHover],
  );
  const keyboardConfig = useMemo(() => ({ enabled: keyboard }), [keyboard]);

  const heightStyle = height ?? (orientation === 'vertical' ? 300 : undefined);

  // Edge-state imperative — không setState (xem note đầu file).
  const syncEdge = (s: SwiperInstance) => {
    if (circular) return;
    prevBtnRef.current?.classList.toggle('opacity-40', s.isBeginning);
    nextBtnRef.current?.classList.toggle('opacity-40', s.isEnd);
  };

  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      <Swiper
        modules={[Autoplay, Keyboard]}
        slidesPerView={itemsPerView}
        spaceBetween={0}
        loop={circular}
        direction={orientation}
        autoplay={autoplayConfig}
        keyboard={keyboardConfig}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          syncEdge(swiper);
          syncActive(swiper);
        }}
        onSlideChange={(swiper) => {
          syncEdge(swiper);
          syncActive(swiper);
          onSlideChange?.(swiper.realIndex);
        }}
        style={heightStyle !== undefined ? { height: heightStyle } : undefined}
      >
        {items.map((item, i) => (
          <SwiperSlide key={i}>{item}</SwiperSlide>
        ))}
      </Swiper>

      {/* Indicators — ô vuông Pagination-style, số trang trong ô; click slideTo(i) */}
      {indicators && items.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              ref={(el) => {
                bulletsRef.current[i] = el;
              }}
              type="button"
              aria-label={`Chuyển tới trang ${i + 1}`}
              aria-current={i === 0 ? 'true' : undefined}
              className={`${BULLET_CLS} ${i === 0 ? BULLET_ACTIVE.join(' ') : BULLET_INACTIVE.join(' ')}`}
              onClick={() => swiperRef.current?.slideTo(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {navEnabled && (
        <>
          <button
            type="button"
            aria-label="Trước"
            ref={prevBtnRef}
            className={`${BTN_CLS} left-2 swiper-button-prev-custom`}
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <Icon name="chevron-left" />
          </button>
          <button
            type="button"
            aria-label="Sau"
            ref={nextBtnRef}
            className={`${BTN_CLS} right-2 swiper-button-next-custom`}
            onClick={() => swiperRef.current?.slideNext()}
          >
            <Icon name="chevron-right" />
          </button>
        </>
      )}
    </div>
  );
}
