// tsup — build dist cho npm publish (batch ⑭ worker B). Workspace VẪN phân phối source
// trực tiếp (exports → ./src/index.ts, consumed qua source); dist CHỈ dùng khi publish
// (publishConfig.exports → dist). dts on; external toàn peer/heavy deps — consumer tự mang:
// react(+jsx-runtime)/react-dom, swiper (+ 'swiper/css' giữ nguyên specifier trong dist),
// zod, chart.js, @fullcalendar/* (schedule là peer-lazy), @tiptap/* (editor).
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    carousel: 'src/entries/carousel.ts',
    chart: 'src/entries/chart.ts',
    schedule: 'src/entries/schedule.ts',
    editor: 'src/entries/editor.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    /^react(-dom)?($|\/)/, // react, react/jsx-runtime, react-dom/client
    /^swiper($|\/)/, // swiper + 'swiper/css' (+/pagination)
    /^zod($|\/)/,
    /^chart\.js($|\/)/,
    /^@fullcalendar\//,
    /^@tiptap\//,
  ],
});
