// Entry subpath 'wakii-ui-kit/carousel' — tách CSS swiper khỏi barrel chính (batch ⑩):
// CSS nặng chỉ kéo khi consumer chọn dùng carousel qua entry này. Barrel chính
// ('wakii-ui-kit') không còn import swiper/css.
import 'swiper/css';
import 'swiper/css/pagination';

export { Carousel, type CarouselProps } from '../ui/carousel/index.js';
