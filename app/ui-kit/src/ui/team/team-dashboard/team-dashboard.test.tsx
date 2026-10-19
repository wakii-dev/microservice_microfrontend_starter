import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TeamDashboard } from './index.js';

afterEach(cleanup);

const PROPS = {
  stats: { agentsBusy: 5, agentsTotal: 7, testsGreen: 96, debtsOpen: 3 },
  events: [{ at: new Date(Date.now() - 60000), actor: 'V1', kind: 'milestone' as const, text: 'gate cross' }],
  stages: [
    { key: 'a', label: 'Baseline', state: 'done' as const },
    { key: 'b', label: 'Depth', state: 'running' as const },
  ],
  debts: [{ item: 'hex cứng', owner: 'v1', status: 'open' as const }],
};

describe('TeamDashboard', () => {
  it('band 3 Statistic: agents-busy · tests-green · debts-open đúng số', () => {
    render(<TeamDashboard {...PROPS} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('/7')).toBeInTheDocument();
    expect(screen.getAllByText('96').length).toBeGreaterThan(0);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Agents busy')).toBeInTheDocument();
    expect(screen.getByText('Debts open')).toBeInTheDocument();
  });

  it('màu KPI theo ngưỡng: tests ≥90 → st-done; debts >0 → st-doing', () => {
    render(<TeamDashboard {...PROPS} />);
    const green = (screen.getByText('96').closest('span[style]') || screen.getByText('96')) as HTMLElement;
    expect(green.style.color).toContain('--st-done');
    const debts = screen.getByText('3').parentElement as HTMLElement;
    expect(debts.style.color).toContain('--st-doing');
  });

  it('compose PingFeed + StagePipeline + DebtBoard trong 1 layout', () => {
    render(<TeamDashboard {...PROPS} />);
    expect(screen.getByText('Team ping')).toBeInTheDocument();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Debt board — R10')).toBeInTheDocument();
    expect(screen.getByText('gate cross')).toBeInTheDocument();
    expect(screen.getByText('Depth')).toBeInTheDocument();
    expect(screen.getByText('hex cứng')).toBeInTheDocument();
  });

  it('footnote render khi truyền', () => {
    render(<TeamDashboard {...PROPS} footnote="Chu kỳ ACK 30s — standup mỗi 30 phút." />);
    expect(screen.getByText('Chu kỳ ACK 30s — standup mỗi 30 phút.')).toBeInTheDocument();
  });
});

describe('TeamDashboard — R0.1 idle-alert', () => {
  it('idle>0 + debts>0 → số agents busy đỏ + Alert "idle while debts open"', () => {
    render(<TeamDashboard {...PROPS} />);
    const busy = screen.getByText('5').parentElement as HTMLElement;
    expect(busy.style.color).toContain('--st-fail');
    expect(screen.getByText(/agent idle while/)).toBeInTheDocument();
  });

  it('debts=0 → không alert dù có idle', () => {
    render(
      <TeamDashboard
        stats={{ agentsBusy: 2, agentsTotal: 7, testsGreen: 100, debtsOpen: 0 }}
        events={[]}
        stages={[]}
        debts={[]}
      />,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('2').style.color).not.toContain('--st-fail');
  });
});
