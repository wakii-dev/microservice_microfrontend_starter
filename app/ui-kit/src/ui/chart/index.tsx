// Chart — PEER-DEP pattern: chart.js lazy import (consumer tự cài — pnpm add chart.js).
// Fix 2026-10-18 (user "docs empty"): (1) fallback giờ chỉ hiện khi import THẤT BẠI
// (trước đây cứ truyền prop fallback là không bao giờ render canvas); (2) config so
// theo JSON (useMemo) — hết destroy/re-create loop mỗi re-render của docs; (3) canvas
// nằm trong container có height chuẩn (default 260px) — chart.js responsive khỏi init 0×0.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';

export interface ChartDataset {
  label: string;
  data: number[];
  /** Màu nền dataset (bar/area) hoặc từng slice (pie/doughnut — truyền mảng cùng độ dài labels). */
  backgroundColor?: string | string[];
  /** Màu viền dataset. */
  borderColor?: string | string[];
  /** Độ dày viền (px) — demo Colors custom. */
  borderWidth?: number;
  /** Override type PER-DATASET cho mixed chart (vd bar + line cùng trục — chart.js v4). */
  type?: 'bar' | 'line';
  /** Passthrough tuỳ chọn chart.js v4 khác (tension, fill, pointRadius…) —
   * surface options quá rộng để liệt kê hết; đánh đổi: typo không bắt tại type. */
  [key: string]: unknown;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
  /** Shape FLAT (chuẩn kit — khuyến nghị): labels/datasets top-level. */
  labels?: string[];
  datasets?: ChartDataset[];
  /** Shape NATIVE chart.js v4 (nested) — Chart chấp nhận CẢ HAI (fix 2026-10-24:
   * app/admin truyền native rồi mà component chỉ đọc flat → chart rỗng câm lặng).
   * Resolve: flat trước, rơi về `data.*` khi flat thiếu. */
  data?: {
    labels?: string[];
    datasets?: ChartDataset[];
  };
  options?: Record<string, unknown>;
}

export interface ChartProps {
  config: ChartConfig;
  /** Chiều cao container (px) — mặc định 260. */
  height?: number;
  className?: string;
  /** Hiện khi chart.js chưa cài/import lỗi (chỉ lúc đó mới dùng). */
  fallback?: ReactNode;
}

/**
 * Đọc export từ module/lazy-namespace MỘT CÁCH AN TOÀN: vitest mock namespace THẮ
 * Error khi truy cập export không định nghĩa ("No X export is defined on the mock")
 * thay vì trả undefined — probe bọc try/catch để chain resolve không vỡ trong test,
 * còn trên bundler thật (ESM không có export) chỉ là undefined tự nhiên.
 */
function safeGet(obj: unknown, key: string): unknown {
  try {
    return (obj as Record<string, unknown>)?.[key];
  } catch {
    return undefined;
  }
}

/**
 * useChartTheme — resolve token màu cho chart canvas theo scope theme bao ngoài
 * (gắn `ref` vào 1 probe span trong đúng scope) + TỰ re-resolve khi theme đổi
 * (attr data-bp-theme/class/style trên <html> hoặc subtree body — MutationObserver,
 * cover cả wrapper div của UiKitProvider). Chart tự re-init khi config JSON đổi →
 * combo này cho dark-toggle LIVE mà KHÔNG cần prop mới trên Chart (F2 2026-10-18).
 * jsdom/unit test không áp CSS → trả `fallback` cho tới khi token có giá trị thật.
 * Truyền `vars`/`fallback` là const ngoài component (deps theo identity).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useChartTheme<T extends Record<string, string>>(
  vars: T,
  fallback: { [K in keyof T]: string },
): { ref: RefObject<HTMLSpanElement | null>; colors: { [K in keyof T]: string } } {
  const ref = useRef<HTMLSpanElement>(null);
  const [colors, setColors] = useState(fallback);
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  useLayoutEffect(() => {
    const resolve = () => {
      const el = ref.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      let next: { [K in keyof T]: string } | null = null;
      for (const key of Object.keys(vars) as (keyof T & string)[]) {
        const value = cs.getPropertyValue(vars[key]).trim();
        if (value && value !== colorsRef.current[key]) {
          next ??= { ...colorsRef.current };
          next[key] = value;
        }
      }
      if (next) setColors(next);
    };
    resolve();
    if (typeof MutationObserver === 'undefined') return undefined;
    const filter = ['data-bp-theme', 'class', 'style'];
    const mo = new MutationObserver(resolve);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: filter });
    mo.observe(document.body, { attributes: true, attributeFilter: filter, subtree: true });
    return () => mo.disconnect();
  }, [vars, fallback]);
  return { ref, colors };
}

export function Chart({ config, height = 260, className, fallback }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);
  const [failed, setFailed] = useState(false);

  // JSON-stable: tránh re-create chart khi parent re-render với object config mới-chứa-nội-dung-cũ
  const stableConfig = useMemo(() => config, [JSON.stringify(config)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (failed) return;
    let cancelled = false;
    let chart: unknown = null;
    (async () => {
      try {
        // Peer-dep lazy (consumer tự cài chart.js) — import qua cast thủ công.
        // Specifier LITERAL (0.6.0 — BUG #4): trước đây qua BIẾN khiến bundler
        // consumer không phân tích được dynamic import → bundle prod giữ nguyên
        // `import("chart.js/auto")` bare mà browser không resolve (fallback câm lặng
        // kể cả khi peer đã cài). Literal → vite dev prebundle + rollup consumer build
        // đều resolve được; peer thiếu → build error RÕ (peer đã khai package.json).
        const mod = (await import('chart.js/auto')) as unknown;
        // Robust interop: ESM thuần có named Chart; một số bundler/interop chỉ trả
        // default. Resolve theo thứ tự — không khớp cái nào → throw (hiện fallback
        // thay vì canvas trắng câm lặng).
        const dflt = safeGet(mod, 'default');
        const Ctor = safeGet(mod, 'Chart') ?? safeGet(dflt, 'Chart') ?? dflt;
        if (cancelled || !canvasRef.current) return;
        if (typeof Ctor !== 'function') {
          throw new Error('chart.js/auto: không resolve được Chart class');
        }
        // Shape chart.js v4: { type, data: { labels, datasets }, options } — NHẤT QUÁN
        // wrap `data`. (Bug "canvas mounted mà alpha=0": labels/datasets truyền
        // top-level → chart init/resize OK nhưng data rỗng → không vẽ, 0 lỗi console.)
        // Fix 2026-10-24 (admin Dashboard chart trống): consumer có thể truyền FLAT
        // (chuẩn kit) lẫn NESTED (native chart.js) — resolve cả 2, flat ưu tiên.
        const src = stableConfig as {
          labels?: string[];
          datasets?: ChartDataset[];
          data?: { labels?: string[]; datasets?: ChartDataset[] };
        };
        const labels = src.labels ?? src.data?.labels;
        const datasets = src.datasets ?? src.data?.datasets;
        chart = new (Ctor as new (...args: unknown[]) => unknown)(canvasRef.current, {
          type: stableConfig.type,
          data: { labels, datasets },
          options: { responsive: true, maintainAspectRatio: false, ...(stableConfig.options ?? {}) },
        });
        chartRef.current = chart;
      } catch (err) {
        console.warn('[ui-kit] chart.js import/init lỗi:', err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (chart) (chart as { destroy(): void }).destroy();
      if (chartRef.current === chart) chartRef.current = null;
    };
  }, [stableConfig, failed]);

  if (failed && fallback !== undefined) return <>{fallback}</>;
  if (failed) return <div style={{ height }} className={`grid place-items-center rounded-lg border border-dashed border-line text-label text-ink3${className ? ` ${className}` : ''}`}>chart.js chưa cài — pnpm add chart.js</div>;

  return (
    <div style={{ height, position: 'relative' }} className={className}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
    </div>
  );
}
