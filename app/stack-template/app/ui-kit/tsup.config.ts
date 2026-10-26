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
    // Entry riêng cho thân Editor — wrapper lazy qua specifier literal (rollup/vite resolve được — fix lazy-load consumer 0.6.0) (esbuild
    // inline dynamic import khi splitting:false); dist/editorInner.js.
    editorInner: 'src/ui/editor/EditorInner.tsx',
    experience3d: 'src/entries/experience3d.ts',
  },
  format: ['esm', 'cjs'],
  // splitting FALSE: mỗi entry self-contained — chunk dùng chung (vd EditorInner)
  // kéo static import peer (@tiptap/starter-kit) vào graph index dù consumer
  // không dùng entry đó → vite build consumer fail resolve (gate starter
  // 2026-10-24). Đổi lại: entry lớn hơn chút nhưng phân lập đúng peer-dep.
  splitting: false,
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
