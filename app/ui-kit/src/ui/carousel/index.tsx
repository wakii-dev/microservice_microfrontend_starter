// Carousel — Swiper engine (peer-dep: consumer tự cài swiper khi dùng subpath này).
// Touch/drag momentum + loop + autoplay + keyboard + a11y — Swiper strengths.
// API giữ tinh thần PrimeReact Carousel (circular/autoplay/indicators/orientation).
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Keyboard, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export interface CarouselProps {
  items: React.ReactNode[];
  circular?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
  pauseOnHover?: boolean;
  indicators?: boolean;
  navigators?: boolean;
  keyboard?: boolean;
  itemsPerView?: number;
  orientation?: 'horizontal' | 'vertical';
  onSlideChange?: (index: number) => void;
  className?: string;
}

const BTN_CLS =
  'absolute z-10 top-1/2 -translate-y-1/2 cursor-pointer rounded-pill border-none bg-[rgba(0,0,0,0.3)] p-1.5 text-white transition-colors hover:bg-[rgba(0,0,0,0.5)]';

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
  className,
}: CarouselProps) {
  const autoplayConfig = autoplay
    ? { delay: autoplayInterval, disableOnInteraction: false, pauseOnMouseEnter: pauseOnHover }
    : undefined;

  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      <Swiper
        modules={[Autoplay, Keyboard, Navigation, Pagination]}
        slidesPerView={itemsPerView}
        spaceBetween={0}
        loop={circular}
        direction={orientation}
        autoplay={autoplayConfig}
        keyboard={{ enabled: keyboard }}
        pagination={
          indicators
            ? {
                clickable: true,
                renderBullet: (_index: number, className: string) =>
                  `<span class="${className} !size-2 !rounded-pill !bg-[rgba(0,0,0,0.2)]"></span>`,
              }
            : false
        }
        onSlideChange={(swiper) => onSlideChange?.(swiper.activeIndex)}
        className={orientation === 'vertical' ? '!h-[300px]' : ''}
      >
        {items.map((item, i) => (
          <SwiperSlide key={i}>{item}</SwiperSlide>
        ))}
      </Swiper>

      {navigators && items.length > 1 && (
        <>
          <button type="button" aria-label="Trước" className={`${BTN_CLS} left-2 !left-2 swiper-button-prev-custom`}>
            ‹
          </button>
          <button type="button" aria-label="Sau" className={`${BTN_CLS} right-2 swiper-button-next-custom`}>
            ›
          </button>
        </>
      )}
    </div>
  );
}
