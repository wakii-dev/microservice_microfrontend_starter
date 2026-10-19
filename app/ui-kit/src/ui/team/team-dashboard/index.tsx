// TeamDashboard — layout compose sẵn (Team-OS): header Statistic band
// (agents-busy · tests-green · debts-open) + PingFeed + StagePipeline 2 cột
// responsive (feed trái rộng, pipeline + debt phải; <lg xếp dọc).
// Depth: các panel con tự mang ele-1/wash — dashboard chỉ lo grid + gap chuẩn.
import type { ReactNode } from 'react';
import { Icon } from '../../icons/index.js';
import { DebtBoard, type DebtItem } from '../debt-board/index';
import { PingFeed, type PingEvent } from '../ping-feed/index';
import { StagePipeline, type PipelineStage } from '../stage-pipeline/index';
import { Statistic } from '../../statistic/index';

export interface TeamStats {
  /** Agent đang bận task. */
  agentsBusy: number;
  /** Tổng agents trong team (mốc để tính busy ratio). */
  agentsTotal: number;
  /** % test suite xanh (0–100). */
  testsGreen: number;
  /** Số debt đang mở. */
  debtsOpen: number;
}

export interface TeamDashboardProps {
  stats: TeamStats;
  events: PingEvent[];
  stages: PipelineStage[];
  debts: DebtItem[];
  /** Chiều sâu queue phân công (R0.1) — truyền để DebtBoard hiện cột Queue. */
  queueDepth?: number;
  /** Node phụ chú thêm dưới band (vd ghi chú chu kỳ). */
  footnote?: ReactNode;
  className?: string;
}

export function TeamDashboard({ stats, events, stages, debts, queueDepth, footnote, className }: TeamDashboardProps) {
  // R0.1 "KHÔNG NGHỈ" thành feature: agent idle MÀ còn debts mở → đỏ + pulse + alert.
  const idle = Math.max(0, stats.agentsTotal - stats.agentsBusy);
  const idleAlert = idle > 0 && stats.debtsOpen > 0;
  return (
    <div className={`flex flex-col gap-6${className ? ` ${className}` : ''}`}>
      {/* Statistic band — 3 KPI (R11: số to tabular, label uppercase) */}
      <section
        aria-label="Team stats"
        className="grid grid-cols-1 gap-4 rounded-xl border border-line bg-s1 p-5 shadow-[var(--ele-1)] [background-image:var(--wash)] sm:grid-cols-3 transition-[box-shadow] duration-[240ms] ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)]"
      >
        <Statistic
          title={
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[2.64px] text-ink3 uppercase">
              Agents busy
              {idleAlert && (
                <span
                  aria-hidden="true"
                  className="size-1.5 animate-[bp-pulse-soft_1.6s_ease-in-out_infinite] rounded-pill bg-st-fail"
                />
              )}
            </span>
          }
          value={
            <span className="inline-flex items-center gap-2 tabular-nums">
              {stats.agentsBusy}
              {idleAlert && <Icon aria-hidden={true} name="exclamation-triangle" size={14} />}
            </span>
          }
          suffix={`/${stats.agentsTotal}`}
          valueStyle={{ color: idleAlert ? 'var(--st-fail)' : 'var(--ink)' }}
        />
        <Statistic
          title={<span className="text-[11px] font-bold tracking-[2.64px] text-ink3 uppercase">Tests green</span>}
          value={<span className="tabular-nums">{stats.testsGreen}</span>}
          suffix="%"
          valueStyle={{ color: stats.testsGreen >= 90 ? 'var(--st-done)' : 'var(--st-doing)' }}
        />
        <Statistic
          title={<span className="text-[11px] font-bold tracking-[2.64px] text-ink3 uppercase">Debts open</span>}
          value={<span className="tabular-nums">{stats.debtsOpen}</span>}
          valueStyle={{ color: stats.debtsOpen === 0 ? 'var(--st-done)' : 'var(--st-doing)' }}
        />
        {idleAlert && (
          <p
            role="status"
            className="m-0 flex items-center gap-2 rounded-lg bg-st-fail/10 px-3 py-1.5 text-label font-semibold text-st-fail sm:col-span-3"
          >
            <Icon aria-hidden={true} name="exclamation-triangle" size={12} />
            {idle} agent idle while {stats.debtsOpen} debts open — phân công lại theo R0.1.
          </p>
        )}
        {footnote && <p className="m-0 self-end text-meta text-ink3 sm:col-span-3">{footnote}</p>}
      </section>

      {/* 2 cột responsive: feed trái (rộng) · pipeline + debt phải */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PingFeed events={events} title="Team ping" />
        <div className="flex flex-col gap-6">
          <section aria-label="Stage pipeline" className="rounded-xl border border-line bg-s1 p-4 shadow-[var(--ele-1)] [background-image:var(--wash)] transition-[box-shadow] duration-[240ms] ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)]">
            <h2 className="m-0 mb-3 text-[12px] font-bold uppercase tracking-[2.4px] text-ink">Pipeline</h2>
            <StagePipeline stages={stages} direction="vertical" />
          </section>
          <DebtBoard debts={debts} queueDepth={queueDepth} agentsIdle={idle} />
        </div>
      </div>
    </div>
  );
}
