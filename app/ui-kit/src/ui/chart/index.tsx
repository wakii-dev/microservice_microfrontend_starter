// Chart — PEER-DEP pattern: chart.js lazy import (consumer tự cài — pnpm add chart.js).
// Fix 2026-10-18 (user "docs empty"): (1) fallback giờ chỉ hiện khi import THẤT BẠI
// (trước đây cứ truyền prop fallback là không bao giờ render canvas); (2) config so
// theo JSON (useMemo) — hết destroy/re-create loop mỗi re-render của docs; (3) canvas
// nằm trong container có height chuẩn (default 260px) — chart.js responsive khỏi init 0×0.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

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
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
  labels: string[];
  datasets: ChartDataset[];
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
        chart = new (Ctor as new (...args: unknown[]) => unknown)(canvasRef.current, {
          type: stableConfig.type,
          data: { labels: stableConfig.labels, datasets: stableConfig.datasets },
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
  if (failed) return <div style={{ height }} className={`grid place-items-center rounded-lg border border-dashed border-line text-meta text-ink3${className ? ` ${className}` : ''}`}>chart.js chưa cài — pnpm add chart.js</div>;

  return (
    <div style={{ height, position: 'relative' }} className={className}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
    </div>
  );
}
