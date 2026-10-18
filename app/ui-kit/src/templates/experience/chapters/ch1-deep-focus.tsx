// CHƯƠNG 01 · DEEP FOCUS — OWNED BY @w6 (R6: chỉ đụng file này)
// CONTRACT (EXPERIENCE-DESIGN.md v0.1 — gate check từng mục):
// - export default function Ch1DeepFocus() — KHÔNG props, data demo tự chứa.
// - Dùng SectionMood từ '../lib/scroll-mood.js': <SectionMood id="ch1" mood="focus"
//   className="relative min-h-[200vh]"> (chương 2 màn — số khổng lồ + split-text).
// - Mood nền: cascade từ CrossfadeBackdrop của index (data-mood="focus" → --c-s1)
//   — KHÔNG tự đặt nền đặc; overlay cục bộ dùng bg-[var(--scrim-*)] nếu cần.
// - Nội dung brief: CountUp 62.210 'giờ tập trung' (format vi-VN) + parallax ảnh
//   nền gần-fixed (Parallax speed 0.08 strength 280) + split-text reveal từng chữ
//   (stagger CSS chars — tự viết trong file, không component mới).
// - Motion: chỉ Parallax/Reveal/CountUp (tự tắt reduced-motion); a11y: h2 + CTA
//   button/a thật; id="ch1" cho Anchor.
export default function Ch1DeepFocus() {
  return null; // stub — @w6 điền
}
