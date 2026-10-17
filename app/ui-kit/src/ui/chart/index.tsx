// Chart — PEER-DEP pattern: chart.js lazy import (consumer tự cài chart.js).
// Lõi ui-kit KHÔNG kéo chart.js — chỉ consumer nào dùng subpath này mới cài.
// Cài: pnpm add chart.js
import { useEffect, useRef, type ReactNode } from 'react';

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
  width?: number;
  height?: number;
  className?: string;
  /** Fallback khi chart.js chưa cài. */
  fallback?: ReactNode;
}

export function Chart({ config, width, height, className, fallback }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Chart: ChartJs } = await import('chart.js/auto');
        if (cancelled || !canvasRef.current) return;
        chartRef.current = new ChartJs(canvasRef.current, config as never);
      } catch {
        console.warn('[ui-kit] chart.js chưa cài — pnpm add chart.js');
      }
    })();
    return () => {
      cancelled = true;
      if (chartRef.current) {
        (chartRef.current as { destroy(): void }).destroy();
        chartRef.current = null;
      }
    };
  }, [config]);

  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <canvas ref={canvasRef} width={width} height={height} className={className} />
  );
}
