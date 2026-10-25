// DebtBoard — bảng nợ kỹ thuật R10 (Team-OS): Table style + Badge owner +
// filter Select theo owner và status (cả hai live, AND). Depth: panel ele-1/wash.
import { useMemo, useState } from 'react';
import { EmptyState } from '../../empty-state/index';
import { Select } from '../../select/index';

export type DebtStatus = 'open' | 'fixed' | 'waived';

export interface DebtItem {
  /** Mục nợ — vd "R6 dirty file đụng trúng". */
  item: string;
  owner: string;
  status: DebtStatus;
}

export interface DebtBoardProps {
  debts: DebtItem[];
  /** Chiều sâu queue phân công (R0.1) — truyền để hiện cột Queue. */
  queueDepth?: number;
  /** Số agent đang idle — kết hợp queueDepth/debts để hiện hint "cần phân công". */
  agentsIdle?: number;
  /** Nhãn bảng. */
  title?: React.ReactNode;
  className?: string;
}

const STATUS_CLS: Record<DebtStatus, string> = {
  open: 'bg-st-fail/10 text-st-fail',
  fixed: 'bg-st-done/10 text-st-done',
  waived: 'bg-st-doing/10 text-st-doing',
};

export function DebtBoard({ debts, queueDepth, agentsIdle, title = 'Debt board — R10', className }: DebtBoardProps) {
  const owners = useMemo(() => [...new Set(debts.map((d) => d.owner))], [debts]);
  const [owner, setOwner] = useState<string>('all');
  const [status, setStatus] = useState<'all' | DebtStatus>('all');

  const rows = useMemo(
    () =>
      debts.filter(
        (d) => (owner === 'all' || d.owner === owner) && (status === 'all' || d.status === status),
      ),
    [debts, owner, status],
  );

  // R0.1: debts mở + queue trống + agent đang idle → hint "cần phân công"
  const needAssign = (queueDepth ?? 0) === 0 && (agentsIdle ?? 0) > 0 && debts.length > 0;

  return (
    <section
      className={`rounded-xl border border-line bg-s1 shadow-[var(--ele-1)] [background-image:var(--wash)] transition-[box-shadow] duration-[240ms] ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)]${
        className ? ` ${className}` : ''
      }`}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-line2 px-4 py-3">
        <h2 className="m-0 text-[12px] font-bold uppercase tracking-[2.4px] text-ink">{title}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            ariaLabel="Lọc theo owner"
            value={owner}
            onChange={(v) => setOwner(String(v))}
            options={[{ label: 'Mọi owner', value: 'all' }, ...owners.map((o) => ({ label: o, value: o }))]}
          />
          <Select
            ariaLabel="Lọc theo status"
            value={status}
            onChange={(v) => setStatus(v as 'all' | DebtStatus)}
            options={[
              { label: 'Mọi trạng thái', value: 'all' },
              { label: 'Open', value: 'open' },
              { label: 'Fixed', value: 'fixed' },
              { label: 'Waived', value: 'waived' },
            ]}
          />
        </div>
      </header>
      {rows.length === 0 ? (
        <EmptyState title="Không có debt khớp bộ lọc" description="Đổi owner/status hoặc xoá bộ lọc để xem lại toàn bộ." />
      ) : (
        <table className="m-0 w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="px-4 py-2.5 text-label font-bold uppercase tracking-[1.5px] text-ink3">Debt</th>
              <th className="px-4 py-2.5 text-label font-bold uppercase tracking-[1.5px] text-ink3">Owner</th>
              <th className="px-4 py-2.5 text-label font-bold uppercase tracking-[1.5px] text-ink3">Status</th>
              {queueDepth !== undefined && (
                <th className="px-4 py-2.5 text-label font-bold uppercase tracking-[1.5px] text-ink3">Queue</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={`${d.owner}-${d.item}`} className="border-t border-line2">
                <td className="px-4 py-2.5 text-body text-ink">{d.item}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-s3 px-2 py-0.5 text-label font-semibold text-ink2">
                    <span aria-hidden="true" className="grid size-4 place-items-center rounded-pill bg-accent/15 text-[8px] font-bold text-accent">
                      {d.owner.slice(0, 1)}
                    </span>
                    {d.owner}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-[1.5px] ${STATUS_CLS[d.status]}`}>
                    {d.status}
                  </span>
                </td>
                {queueDepth !== undefined && (
                  <td className="px-4 py-2.5">
                    {needAssign ? (
                      <span className="font-semibold text-st-fail">cần phân công</span>
                    ) : (
                      <span className="font-mono tabular-nums text-label text-ink2">{queueDepth}</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
