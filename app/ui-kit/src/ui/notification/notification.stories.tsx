// Parity matrix antd→tokens: docs/parity-matrix.md
// Notification stories — static API demo (parity antd Notification: top-right).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Icon } from '../icons/index.js';
import { notification } from './index';

/** Rich toast with title + description — static API, 4.5s. */
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

// ── Real-world usage (2026-10-25): notification center panel ──

type CenterNotif = {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  kind: 'success' | 'error' | 'info';
};

const INITIAL_NOTIFS: CenterNotif[] = [
  { id: 'n1', title: 'Deploy finished', description: 'web · production — 2m 41s, all checks green.', time: '2m', unread: true, kind: 'success' },
  { id: 'n2', title: 'Saga assignment failed', description: 'fail@demo.local — task moved to DLQ after 3 retries.', time: '18m', unread: true, kind: 'error' },
  { id: 'n3', title: 'Weekly digest ready', description: '6 PRs merged, 14 tasks closed this week.', time: '1h', unread: false, kind: 'info' },
];

const KIND_DOT: Record<CenterNotif['kind'], string> = {
  success: 'bg-st-done',
  error: 'bg-st-fail',
  info: 'bg-accent',
};

/** NotificationCenter — dropdown/panel pattern: unread dots, relative times, "Mark all
 * read". The button also fires a REAL `notification.info()` slide-in so the imperative
 * API and the panel can be compared side by side. */
export const NotificationCenter: Story = {
  name: 'Notification center — unread dots, relative time, mark all read',
  render: () => <NotificationCenterDemo />,
};

function NotificationCenterDemo() {
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const unread = notifs.filter((n) => n.unread).length;

  return (
    <div className="flex w-full max-w-md flex-col rounded-xl border border-line bg-s1 shadow-[var(--shadow-pop)]">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-body font-semibold text-ink">
          <Icon name="bell" size={14} />
          {'Notifications'}
          {unread > 0 && (
            <span className="rounded-pill bg-st-fail/10 px-2 py-0.5 text-meta font-medium text-st-fail">
              {unread} mới
            </span>
          )}
        </span>
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent p-0 text-meta text-accent hover:underline"
          onClick={() => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })))}
        >
          {'Mark all read'}
        </button>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {notifs.map((n) => (
          <li key={n.id} className={`flex items-start gap-3 px-4 py-3${n.unread ? ' bg-s3/60' : ''}`}>
            <span
              aria-hidden="true"
              className={`mt-1.5 inline-block size-2 shrink-0 rounded-pill ${n.unread ? KIND_DOT[n.kind] : 'bg-transparent'}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-body font-medium text-ink">{n.title}</span>
                <span className="shrink-0 text-meta text-ink3">{n.time}</span>
              </div>
              <p className="m-0 mt-0.5 text-meta text-ink2">{n.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-4 py-3">
        <Button size="small" onClick={() => notification.info('Backup completed', 'Nightly snapshot stored — 1.2 GB.')}>
          {'Send test notification'}
        </Button>
      </div>
    </div>
  );
}
