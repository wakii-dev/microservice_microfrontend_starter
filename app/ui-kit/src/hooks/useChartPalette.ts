// useChartPalette — PUBLIC palette hook (theming 2, 2026-10-27): trả BỘ MÀU CHUẨN
// cho chart dataset/graphic, resolved từ tokens theo scope theme bao ngoài + LIVE
// theo theme (dark-toggle re-resolve). Mượn engine useChartTheme (ui/chart — probe
// ref + MutationObserver) làm nguồn duy nhất của luồng resolve, không duplicate logic.
//
// CUSTOM MÀU DATASET VẪN THEO THEME: thay vì hardcode hex vào datasets, lấy màu từ
// palette (`backgroundColor: palette.accent`) — chart tự ăn brand override của
// UiKitProvider và dark mode mà KHÔNG cần prop mới trên Chart (config JSON đổi khi
// palette đổi → Chart re-init, xem story DarkToggleLive của ui/chart).
//
// Dùng: gắn `ref` vào 1 element ẩn trong đúng scope theme (vd `<span ref={ref} hidden />`
// trong subtree UiKitProvider), rồi đọc `palette`. jsdom/unit test không áp CSS →
// palette = fallback (= token LIGHT mặc định trong styles/tokens.css).
import type { RefObject } from 'react';
import { useChartTheme } from '../ui/chart/index.js';

/** Palette chuẩn cho chart — key theo NGHIỆP VỤ (stDone…), giá trị là màu resolved. */
export type ChartPalette = {
  /** Brand chính — dataset nhấn/line chính (--accent). */
  accent: string;
  /** Brand hover/sáng hơn — dataset phụ (--accent-hi). */
  accentHi: string;
  /** Mực chính — label/tick đậm (--ink). */
  ink: string;
  /** Mực phụ — legend/secondary text (--ink2). */
  ink2: string;
  /** Mực meta — axis ticks nhạt (--ink3). */
  ink3: string;
  /** Viền lưới/trục (--line). */
  line: string;
  /** Nền canvas/scope (--c-canvas) — khớp nền chart với surface. */
  canvas: string;
  /** Surface 1 (--c-s1) — nền khối lớn. */
  s1: string;
  /** Surface 2 (--c-s2) — nền card/panel. */
  s2: string;
  /** Surface 3 (--c-s3) — nền row/hover. */
  s3: string;
  /** Trạng thái done (--st-done). */
  stDone: string;
  /** Trạng thái doing (--st-doing). */
  stDoing: string;
  /** Trạng thái fail (--st-fail). */
  stFail: string;
};

// Palette key → token var — map thẳng styles/tokens.css (--accent/--c-canvas/--st-done…).
const CHART_VARS = {
  accent: '--accent',
  accentHi: '--accent-hi',
  ink: '--ink',
  ink2: '--ink2',
  ink3: '--ink3',
  line: '--line',
  canvas: '--c-canvas',
  s1: '--c-s1',
  s2: '--c-s2',
  s3: '--c-s3',
  stDone: '--st-done',
  stDoing: '--st-doing',
  stFail: '--st-fail',
} as const;

// Fallback = token LIGHT mặc định (styles/tokens.css) — dùng khi probe chưa gắn scope
// (jsdom/unit test) hoặc var chưa resolve; là giá trị token thật, không màu "giả".
const CHART_FALLBACK: ChartPalette = {
  accent: '#1677ff',
  accentHi: '#4096ff',
  ink: 'rgba(0, 0, 0, 0.88)',
  ink2: 'rgba(0, 0, 0, 0.65)',
  ink3: 'rgba(0, 0, 0, 0.45)',
  line: '#e2e5ea',
  canvas: '#f5f5f5',
  s1: '#ffffff',
  s2: '#ffffff',
  s3: '#fafafa',
  stDone: '#52c41a',
  stDoing: '#faad14',
  stFail: '#ff4d4f',
};

export interface UseChartPaletteReturn {
  /** Gắn vào 1 element ẩn TRONG đúng scope theme — probe đọc token qua computed style. */
  ref: RefObject<HTMLSpanElement | null>;
  /** Palette resolved — live theo theme (attr data-bp-theme/class/style đổi → re-resolve). */
  palette: ChartPalette;
}

/**
 * useChartPalette — palette chuẩn { accent, accentHi, ink, ink2, ink3, line, canvas,
 * s1, s2, s3, stDone, stDoing, stFail } resolved từ tokens theo scope theme + live
 * theo theme (MutationObserver — cùng cơ chế useChartTheme).
 *
 * @example
 * const { ref, palette } = useChartPalette();
 * return (
 *   <UiKitProvider theme={dark ? 'dark' : 'light'}>
 *     <span ref={ref} hidden />
 *     <Chart config={{ type: 'bar', datasets: [{ backgroundColor: palette.accent }] }} />
 *   </UiKitProvider>
 * );
 */
export function useChartPalette(): UseChartPaletteReturn {
  const { ref, colors } = useChartTheme(CHART_VARS, CHART_FALLBACK);
  return { ref, palette: colors };
}
