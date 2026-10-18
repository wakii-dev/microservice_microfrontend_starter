// Parity matrix antd→tokens: docs/parity-matrix.md
// Notification stories — static API demo (parity antd Notification: top-right).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { notification } from './index';

const meta = { title: 'Feedback/Notification', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const FourTypes: Story = {
  name: '4 types — success/info/warning/error',
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button type="primary" onClick={() => notification.success('Sync completed', 'Feed has been updated')}>
        success
      </Button>
      <Button onClick={() => notification.info('A new update is available')}>info</Button>
      <Button onClick={() => notification.warning('Token expires soon')}>warning</Button>
      <Button type="primary" danger onClick={() => notification.error('Sync failed', 'node-svc is not responding')}>
        error
      </Button>
    </div>
  ),
};

export const NoDescription: Story = {
  name: 'No description — title only',
  render: () => (
    <Button onClick={() => notification.info('Task assigned to alice')}>
      Send title-only notification
    </Button>
  ),
};

export const CustomStyled: Story = {
  name: 'CustomStyled — classNames slots (antd v5 style)',
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button
        onClick={() =>
          notification.success('Tinted card', 'Card wrapper slot adds a green tint + ring.', {
            wrapper: 'ring-1 ring-st-done',
          })
        }
      >
        wrapper slot
      </Button>
      <Button
        onClick={() =>
          notification.info('Uppercase title', 'Title slot adds uppercase tracking.', {
            title: 'uppercase tracking-wide',
          })
        }
      >
        title slot
      </Button>
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — panel bg-s2 + dark border-line',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <Button type="primary" onClick={() => notification.success('Sync completed', 'Feed has been updated (dark scope)')}>
        success (dark)
      </Button>
    </div>
  ),
};
