// Parity matrix antd→tokens: docs/parity-matrix.md
// Result stories — success/error/404 (icon per status; no custom icon prop).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Result } from './index';
import { Button } from '../button/index';

/** Full-area status page — icon + title + actions per status. */
const meta = { title: 'Feedback/Result', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  name: 'Success — with extra actions',
  render: () => (
    <Result
      status="success"
      title="Task created"
      subTitle="Task FE-42 is now in the sprint 12 backlog."
      extra={<Button type="primary">View task</Button>}
    />
  ),
};

export const Error: Story = {
  name: 'Error — assignee failure',
  render: () => (
    <Result
      status="error"
      title="Assignment failed"
      subTitle="fail@demo.local did not receive the task — event went to the DLQ."
      extra={<Button>Retry</Button>}
    />
  ),
};

export const NotFound: Story = {
  name: '404 — page not found',
  render: () => (
    <Result
      status="404"
      title="404"
      subTitle="The page you are looking for does not exist or was deleted."
      extra={<Button type="primary">Back to home</Button>}
    />
  ),
};

export const ServerError: Story = {
  name: '500 — server error',
  render: () => (
    <Result
      status="500"
      title="500"
      subTitle="node-svc is not responding — on-call has been paged."
      extra={<Button>Retry</Button>}
    />
  ),
};

export const WarningInfo: Story = {
  name: 'Warning + Info — secondary statuses',
  render: () => (
    <div className="flex gap-8">
      <Result status="warning" title="Due soon" subTitle="3 tasks due within 24h." />
      <Result status="info" title="Scheduled maintenance" subTitle="Today 22:00–23:00." />
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — dark ink + status colors',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <Result
        status="success"
        title="Task created"
        subTitle="Task FE-42 is now in the sprint 12 backlog (dark scope)."
        extra={<Button type="primary">View task</Button>}
      />
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the centered
 * column, `icon`/`title`/`subTitle`/`extra` on each part; `style` lands on the
 * root; the user's className always comes last. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <Result
      status="success"
      title="Deployment complete"
      subTitle="All 12 services passed the smoke suite."
      extra={<Button type="primary">Open dashboard</Button>}
      classNames={{
        root: 'rounded-xl border border-dashed border-accent bg-accent/5',
        icon: 'drop-shadow-lg',
        title: 'tracking-wide uppercase text-label',
        subTitle: 'italic',
        extra: 'border-t border-line pt-3',
      }}
      style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
    />
  ),
};
