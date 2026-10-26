// Carousel tests — hành vi thật: navigators SỐNG (click đổi realIndex), tắt
// indicators/navigators, ≤1 item ẩn nút, mapping config (loop/autoplay/direction/
// slidesPerView/keyboard), onSlideChange realIndex, height prop.
// Swiper init được trong jsdom (0-dim vẫn slideTo được — realIndex đổi, slideChange
// bắn); instance lấy qua `el.swiper` (core gắn sẵn). Ghi chú: isBeginning/isEnd
// đều true ở 0-dim (degenerate) nên KHÔNG assert visual edge-state trong jsdom.
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Swiper as SwiperInstance } from 'swiper';
import { Carousel } from './index.js';

afterEach(cleanup);

const items = ['Slide A', 'Slide B', 'Slide C'];

type Props = Parameters<typeof Carousel>[0];

function getSwiper(): SwiperInstance {
  return (document.querySelector('.swiper') as HTMLElement & { swiper: SwiperInstance }).swiper;
}

function renderCarousel(props: Partial<Props> = {}) {
  render(<Carousel items={items.map((t) => <p key={t}>{t}</p>)} {...props} />);
}

describe('Carousel — render & navigators', () => {
  it('renders all items', () => {
    renderCarousel();
    expect(screen.getByText('Slide A')).toBeInTheDocument();
    expect(screen.getByText('Slide C')).toBeInTheDocument();
  });

  it('navigators SỐNG — click Sau/Trước đổi realIndex (regression nút chết)', () => {
    renderCarousel();
    expect(getSwiper().realIndex).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Sau' }));
    expect(getSwiper().realIndex).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Trước' }));
    expect(getSwiper().realIndex).toBe(0);
  });

  it('nút custom có class đánh dấu + aria-label', () => {
    renderCarousel();
    expect(screen.getByRole('button', { name: 'Trước' })).toHaveClass('swiper-button-prev-custom');
    expect(screen.getByRole('button', { name: 'Sau' })).toHaveClass('swiper-button-next-custom');
  });

  it('navigators=false → không render nút', () => {
    renderCarousel({ navigators: false });
    expect(screen.queryByRole('button', { name: 'Trước' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sau' })).toBeNull();
  });

  it('items.length ≤ 1 → ẩn nút kể cả navigators=true', () => {
    render(<Carousel items={[<p key="a">Single</p>]} />);
    expect(screen.queryByRole('button', { name: 'Trước' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sau' })).toBeNull();
  });
});

describe('Carousel — indicators', () => {
  it('mặc định: ô vuông Pagination-style, số trang trong ô + active ở đầu', () => {
    renderCarousel();
    const bullets = screen.getAllByRole('button', { name: /Chuyển tới trang/ });
    expect(bullets).toHaveLength(3);
    expect(bullets[0]).toHaveClass('h-8', 'min-w-8', 'rounded-lg');
    // slide 0 active lúc init: bg-accent + border-none, KHÔNG hover:bg-s3
    expect(bullets[0]).toHaveClass('bg-accent', 'border-none', 'font-medium', 'text-white');
    expect(bullets[0]).not.toHaveClass('hover:bg-s3');
    expect(bullets[0]).toHaveTextContent('1');
    expect(bullets[0]).toHaveAttribute('aria-current', 'true');
    expect(bullets[1]).toHaveClass('border-line', 'hover:bg-s3');
    expect(bullets[1]).not.toHaveAttribute('aria-current');
  });

  it('indicators=false → không render indicator', () => {
    renderCarousel({ indicators: false });
    expect(screen.queryByRole('button', { name: /Chuyển tới trang/ })).toBeNull();
  });

  it('click bullet → slideTo đúng index + active class/aria-current chuyển (regression chấm tròn)', () => {
    renderCarousel();
    const bullets = screen.getAllByRole('button', { name: /Chuyển tới trang/ });
    fireEvent.click(bullets[2]);
    expect(getSwiper().realIndex).toBe(2);
    expect(bullets[2]).toHaveClass('bg-accent', 'font-medium', 'text-white', 'border-none');
    expect(bullets[2]).toHaveAttribute('aria-current', 'true');
    expect(bullets[0]).not.toHaveClass('bg-accent');
    expect(bullets[0]).not.toHaveAttribute('aria-current');
    // active KHÔNG mang hover:bg-s3 — :hover (0,2,0) thắng bg-accent (0,1,0) khi
    // chuột đè lên bullet active → trắng-trên-trắng (regression verify :6006)
    expect(bullets[2]).not.toHaveClass('hover:bg-s3');
  });
});

describe('Carousel — mapping config', () => {
  it('circular → loop=true; mặc định loop=false', () => {
    renderCarousel({ circular: true });
    expect(getSwiper().params.loop).toBe(true);
    cleanup();
    renderCarousel();
    expect(getSwiper().params.loop).toBe(false);
  });

  it('autoplay + interval + pauseOnHover → config autoplay đúng; off → enabled=false', () => {
    renderCarousel({ autoplay: true, autoplayInterval: 2500, pauseOnHover: true });
    expect(getSwiper().params.autoplay).toMatchObject({
      enabled: true,
      delay: 2500,
      pauseOnMouseEnter: true,
      disableOnInteraction: false,
    });
    cleanup();
    renderCarousel();
    expect(getSwiper().params.autoplay).toMatchObject({ enabled: false });
  });

  it('orientation vertical → direction=vertical; itemsPerView → slidesPerView', () => {
    renderCarousel({ orientation: 'vertical', itemsPerView: 3 });
    expect(getSwiper().params.direction).toBe('vertical');
    expect(getSwiper().params.slidesPerView).toBe(3);
  });

  it('keyboard=false → keyboard.enabled=false; mặc định true', () => {
    renderCarousel({ keyboard: false });
    expect(getSwiper().params.keyboard).toMatchObject({ enabled: false });
    cleanup();
    renderCarousel();
    expect(getSwiper().params.keyboard).toMatchObject({ enabled: true });
  });
});

describe('Carousel — onSlideChange & height', () => {
  it('onSlideChange bắn index realIndex khi navigate', () => {
    const onSlideChange = vi.fn();
    renderCarousel({ onSlideChange });
    fireEvent.click(screen.getByRole('button', { name: 'Sau' }));
    expect(onSlideChange).toHaveBeenCalledWith(1);
  });

  it('height prop → inline style; vertical không truyền → default 300px', () => {
    renderCarousel({ height: 480 });
    expect((document.querySelector('.swiper') as HTMLElement).style.height).toBe('480px');
    cleanup();
    renderCarousel({ orientation: 'vertical' });
    expect((document.querySelector('.swiper') as HTMLElement).style.height).toBe('300px');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Carousel — classNames slots + style', () => {
  it('slots root/indicators/indicator/navigator lên đúng element', () => {
    const { container } = render(
      <Carousel
        items={[<div key="1">A</div>, <div key="2">B</div>]}
        classNames={{ root: 'slot-root', indicators: 'slot-inds', indicator: 'slot-ind', navigator: 'slot-nav' }}
      />,
    );
    expect(container.firstElementChild).toHaveClass('slot-root');
    expect(document.querySelector('.slot-inds')).not.toBeNull();
    expect(screen.getAllByRole('button', { name: /Chuyển tới trang/ })[0]).toHaveClass('slot-ind');
    expect(screen.getByRole('button', { name: 'Trước' })).toHaveClass('slot-nav');
    expect(screen.getByRole('button', { name: 'Sau' })).toHaveClass('slot-nav');
  });

  it('style passthrough lên root; className người dùng sau root slot', () => {
    const { container } = render(
      <Carousel
        items={[<div key="1">A</div>, <div key="2">B</div>]}
        style={{ padding: '2px' }}
        classNames={{ root: 'slot-root' }}
        className="user-last"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveStyle({ padding: '2px' });
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
  });
});
