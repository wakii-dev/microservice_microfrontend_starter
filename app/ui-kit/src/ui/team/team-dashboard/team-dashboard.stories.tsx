// TeamDashboard stories — layout compose Team-OS (stats band + feed + pipeline + debt).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TeamDashboard } from './index';

const meta = { title: 'Domain/TeamDashboard', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

const NOW = Date.now();
const at = (min: number) => new Date(NOW - min * 60000);

/** Basic — dashboard đầy đủ + R0.1 idle-alert (2 agent idle trong khi 2 debts mở). */
export const Basic: S = {
  render: () => (
    <TeamDashboard
      stats={{ agentsBusy: 5, agentsTotal: 7, testsGreen: 96, debtsOpen: 2 }}
      queueDepth={0}
      events={[
        { at: at(2), actor: 'V1', kind: 'report', text: 'Depth baseline 14 grid chụp xong.' },
        { at: at(18), actor: 'V2', kind: 'start', text: 'Depth wave 2 — 6 component.' },
        { at: at(41), actor: 'W6', kind: 'milestone', text: 'Team-OS 5 comp gate 23/23.' },
        { at: at(52), actor: 'D', kind: 'idle-alert', text: 'Idle 20 phút — cần phân công.' },
        { at: at(70), actor: 'W8', kind: 'blocked', text: 'Chart legend color theo token — chờ probe.' },
      ]}
      stages={[
        { key: 'baseline', label: 'Baseline', state: 'done' },
        { key: 'depth', label: 'Depth pass', state: 'running' },
        { key: 'after', label: 'After-shot', state: 'pending' },
      ]}
      debts={[
        { item: 'Descriptions dd min-w-0', owner: 'd', status: 'open' },
        { item: 'Landing spark fill TS', owner: 'v2', status: 'fixed' },
      ]}
      footnote="Chu kỳ ACK 30s · standup mỗi 30 phút — RULES R4/R8."
    />
  ),
};

/** AllClear — mọi chỉ xanh: debts 0, tests 100, không blocked event. */
export const AllClear: S = {
  name: 'All clear — KPI xanh toàn bộ',
  render: () => (
    <TeamDashboard
      stats={{ agentsBusy: 2, agentsTotal: 7, testsGreen: 100, debtsOpen: 0 }}
      events={[{ at: at(4), actor: 'D', kind: 'milestone', text: 'Gate pass — không debt mở.' }]}
      stages={[
        { key: 'depth', label: 'Depth pass', state: 'done' },
        { key: 'gate', label: 'Gate', state: 'done' },
      ]}
      debts={[]}
    />
  ),
};

/** DarkTheme — toàn bộ cascade token trên dark canvas. */
export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="p-3">
      <TeamDashboard
        stats={{ agentsBusy: 6, agentsTotal: 7, testsGreen: 88, debtsOpen: 4 }}
        events={[{ at: at(6), actor: 'V2', kind: 'start', text: 'Depth wave 2 — night mode.' }]}
        stages={[
          { key: 'wave1', label: 'Wave 1', state: 'done' },
          { key: 'wave2', label: 'Wave 2', state: 'running' },
          { key: 'gate', label: 'Gate', state: 'pending' },
        ]}
        debts={[{ item: 'Contrast sweep sót tooltip', owner: 'w8', status: 'open' }]}
      />
    </div>
  ),
};
