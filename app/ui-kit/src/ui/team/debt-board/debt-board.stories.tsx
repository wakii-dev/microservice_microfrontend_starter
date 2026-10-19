// DebtBoard stories — R10 debt board với filter owner/status live.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DebtBoard } from './index';

const meta = { title: 'Domain/DebtBoard', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — debts thật + R0.1 hint "cần phân công" (queue 0 trong khi agent idle). */
export const Basic: S = {
  render: () => (
    <DebtBoard
      className="max-w-2xl"
      queueDepth={0}
      agentsIdle={2}
      debts={[
        { item: 'Story 0 export const — indexer drop', owner: 'v2', status: 'fixed' },
        { item: 'Popover labelledby wire', owner: 'w6', status: 'fixed' },
        { item: 'Relative path root gây file lạc', owner: 'v1', status: 'open' },
        { item: 'Scrollbar token legacy', owner: 'w7', status: 'waived' },
        { item: 'Dark tokens audit sót avatar', owner: 'w7', status: 'open' },
      ]}
    />
  ),
};

/** Empty — filter không khớp → EmptyState. */
export const Empty: S = {
  name: 'Empty — filter không khớp',
  render: () => (
    <DebtBoard
      className="max-w-2xl"
      debts={[{ item: 'Demo debt', owner: 'w6', status: 'fixed' }]}
    />
  ),
};

/** DarkTheme — bảng + badge trên dark canvas. */
export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="p-2">
      <DebtBoard
        className="max-w-2xl"
        debts={[
          { item: 'Saga assign treo DLQ', owner: 'v1', status: 'open' },
          { item: 'CSV export delimiter', owner: 'w6', status: 'fixed' },
        ]}
      />
    </div>
  ),
};
