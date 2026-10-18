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
import { Autoplay, Keyboard, Pagination } from 'swiper/modules';
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
  /** Bullet indicators dưới (swiper Pagination — clickable). */
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
  'absolute z-10 top-1/2 -translate-y-1/2 cursor-pointer rounded-pill border-none bg-scrim-2 p-1.5 text-white outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas transition-[background-color,transform] hover:bg-scrim-3 active:scale-95';

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
  const navEnabled = navigators && items.length > 1;

  // Memoize config objects — swiper/react so params theo reference (xem note đầu file).
  const autoplayConfig = useMemo(
    () =>
      autoplay
        ? { delay: autoplayInterval, disableOnInteraction: false, pauseOnMouseEnter: pauseOnHover }
        : false,
    [autoplay, autoplayInterval, pauseOnHover],
  );
  const keyboardConfig = useMemo(() => ({ enabled: keyboard }), [keyboard]);
  const paginationConfig = useMemo(
    () =>
      indicators
        ? {
            clickable: true,
            renderBullet: (_index: number, className: string) =>
              // Important HẬU TỐ (TW v4) — swiper.css là unlayered nên thắng mọi utility
              // thường; tiền tố `!` cũ là syntax v3 → no-op (bullet trượt default swiper).
              // Bullet trung tính theo scrim token; active đậm hơn qua variant class
              // swiper tự gắn (chuỗi class nằm trong source để Tailwind quét).
              `<span class="${className} size-2! rounded-pill! bg-scrim-2! opacity-100! [&.swiper-pagination-bullet-active]:bg-scrim-3!"></span>`,
          }
        : false,
    [indicators],
  );

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
        modules={[Autoplay, Keyboard, Pagination]}
        slidesPerView={itemsPerView}
        spaceBetween={0}
        loop={circular}
        direction={orientation}
        autoplay={autoplayConfig}
        keyboard={keyboardConfig}
        pagination={paginationConfig}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          syncEdge(swiper);
        }}
        onSlideChange={(swiper) => {
          syncEdge(swiper);
          onSlideChange?.(swiper.realIndex);
        }}
        style={heightStyle !== undefined ? { height: heightStyle } : undefined}
      >
        {items.map((item, i) => (
          <SwiperSlide key={i}>{item}</SwiperSlide>
        ))}
      </Swiper>

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
