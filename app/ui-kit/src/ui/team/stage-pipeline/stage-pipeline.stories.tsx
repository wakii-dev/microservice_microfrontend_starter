// StagePipeline stories — team pipeline với gate + aria-current step.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StagePipeline } from './index';

/** Pipeline stages nối mũi tên, state màu token. */
const meta = { title: 'Domain/StagePipeline', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — full pipeline với running + gated giữa đường. */
export const Basic: S = {
  render: () => (
    <StagePipeline
      stages={[
        { key: 'baseline', label: 'Baseline', state: 'done' },
        { key: 'depth', label: 'Depth pass', state: 'running' },
        { key: 'review', label: 'Gate review', state: 'gated' },
        { key: 'ship', label: 'Ship', state: 'pending' },
      ]}
    />
  ),
};

/** AllDone — mọi stage done (không aria-current). */
export const AllDone: S = {
  name: 'All done — pipeline hoàn tất',
  render: () => (
    <StagePipeline
      stages={[
        { key: 'brief', label: 'Brief', state: 'done' },
        { key: 'code', label: 'Code', state: 'done' },
        { key: 'verify', label: 'Verify', state: 'done' },
      ]}
    />
  ),
};

/** Vertical — direction="vertical" cho sidebar hẹp. */
export const Vertical: S = {
  name: 'Vertical — sidebar layout',
  render: () => (
    <StagePipeline
      direction="vertical"
      stages={[
        { key: 'baseline', label: 'Baseline', state: 'done' },
        { key: 'apply', label: 'Áp depth', state: 'running' },
        { key: 'gate', label: 'Gate', state: 'gated' },
        { key: 'after', label: 'After-shot', state: 'pending' },
      ]}
    />
  ),
};

/** DarkTheme — chip màu token trên dark canvas. */
export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="p-3">
      <StagePipeline
        stages={[
          { key: 'sweep', label: 'Sweep', state: 'done' },
          { key: 'fix', label: 'Fix', state: 'running' },
          { key: 'gate', label: 'Gate', state: 'pending' },
        ]}
      />
    </div>
  ),
};
