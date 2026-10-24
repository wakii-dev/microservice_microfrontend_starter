// Overlay EXTRA: carousel — trang demo <Carousel> qua subpath '@wakii/ui-kit/carousel'
// (engine thêm route '/carousel' + chèn dep bên dưới).
// ⚠️ PEER DEP — CLI thêm vào dependencies khi chọn extra này:
//   "swiper": "^14.3.0"
// (Entry '@wakii/ui-kit/carousel' tự import 'swiper/css' — CSS swiper chỉ kéo
// vào bundle khi consumer import qua subpath này.)
import { Carousel } from '@wakii/ui-kit/carousel';
import { Text, Title } from '@wakii/ui-kit';

const SLIDE_STYLES = [
  'from-indigo-500 to-sky-400',
  'from-rose-500 to-orange-400',
  'from-emerald-500 to-teal-400',
  'from-violet-500 to-fuchsia-400',
];

const slides = ['Aurora', 'Cascade', 'Dune', 'Nimbus'].map((name, i) => (
  <div
    key={name}
    className={`grid h-56 place-items-center rounded-xl bg-gradient-to-br text-h1 font-semibold text-white ${SLIDE_STYLES[i % SLIDE_STYLES.length]}`}
  >
    {name}
  </div>
));

/** Route gợi ý cho engine: '/carousel'. */
export function CarouselDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Title level={2}>Carousel</Title>
      <Text type="secondary">
        Swiper-powered — autoplay, keyboard arrows (← →), pause on hover, pagination indicators.
      </Text>
      <Carousel autoplay circular indicators items={slides} keyboard navigators pauseOnHover />
    </div>
  );
}
