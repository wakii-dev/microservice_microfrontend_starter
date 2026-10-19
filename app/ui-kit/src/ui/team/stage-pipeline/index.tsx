// StagePipeline — pipeline các stage của đội: mũi tên nối + state màu token
// (pending=ink3 · running=accent pulse · gated=st-doing + gate icon · done=st-done)
// + aria-current="step" cho stage đang chạy. Depth: ele-1 panel + ease-smooth.
import { Icon } from '../../icons/index.js';

export type StageState = 'pending' | 'running' | 'gated' | 'done';

export interface PipelineStage {
  key: string;
  label: string;
  state: StageState;
}

export interface StagePipelineProps {
  stages: PipelineStage[];
  /** Hướng ngang (mặc định) hay dọc. */
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

const STATE_CLS: Record<StageState, { chip: string; icon: string; iconCls: string }> = {
  pending: { chip: 'border-line bg-s1 text-ink3', icon: 'clock', iconCls: 'text-ink3' },
  running: { chip: 'border-accent bg-accent/10 text-accent', icon: 'refresh', iconCls: 'text-accent animate-[bp-pulse-soft_1.6s_ease-in-out_infinite]' },
  gated: { chip: 'border-st-doing bg-st-doing/10 text-st-doing', icon: 'exclamation-triangle', iconCls: 'text-st-doing' },
  done: { chip: 'border-st-done bg-st-done/10 text-st-done', icon: 'check', iconCls: 'text-st-done' },
};

export function StagePipeline({ stages, direction = 'horizontal', className }: StagePipelineProps) {
  const vertical = direction === 'vertical';
  return (
    <ol
      aria-label="Team pipeline"
      className={`m-0 flex list-none p-0 ${vertical ? 'flex-col gap-2' : 'flex-wrap items-center gap-2'}${
        className ? ` ${className}` : ''
      }`}
    >
      {stages.map((s, i) => {
        const meta = STATE_CLS[s.state];
        const isCurrent = s.state === 'running' || s.state === 'gated';
        return (
          <li key={s.key} className="flex items-center gap-2" aria-current={isCurrent ? 'step' : undefined}>
            <span
              className={`inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-label font-semibold shadow-[var(--ele-1)] transition-[box-shadow] duration-[240ms] ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)] ${meta.chip}`}
            >
              <span aria-hidden="true" className="font-mono text-[10px] opacity-70">
                {String(i + 1).padStart(2, '0')}
              </span>
              {s.label}
              <Icon aria-hidden={true} name={meta.icon as never} size={12} className={meta.iconCls} />
              {s.state === 'gated' && <span className="sr-only">(gate — chờ duyệt)</span>}
            </span>
            {!vertical && i < stages.length - 1 && (
              <Icon aria-hidden={true} name="arrow-right" size={12} className="shrink-0 text-ink3" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
