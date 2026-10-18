// Chart — PEER-DEP pattern: chart.js lazy import (consumer tự cài — pnpm add chart.js).
// Fix 2026-10-18 (user "docs empty"): (1) fallback giờ chỉ hiện khi import THẤT BẠI
// (trước đây cứ truyền prop fallback là không bao giờ render canvas); (2) config so
// theo JSON (useMemo) — hết destroy/re-create loop mỗi re-render của docs; (3) canvas
// nằm trong container có height chuẩn (default 260px) — chart.js responsive khỏi init 0×0.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
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
        // @ts-ignore — peer-dep lazy (consumer tự cài chart.js)
        const { Chart: ChartJs } = await import('chart.js/auto');
        if (cancelled || !canvasRef.current) return;
        chart = new ChartJs(canvasRef.current, {
          ...stableConfig,
          options: { responsive: true, maintainAspectRatio: false, ...(stableConfig.options ?? {}) },
        } as never);
        chartRef.current = chart;
      } catch {
        console.warn('[ui-kit] chart.js chưa cài — pnpm add chart.js');
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
