// List stories — Data Display. antd List parity (renderItem/divider/bordered/
// pagination/loading skeleton/empty→EmptyState) + NotificationInbox (rich media).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/index';
import { Icon, type IconName } from '../icons/index';
import { Tag } from '../tag/index';
import { List } from './index';

function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

interface TaskItem {
  id: string;
  title: string;
  status: string;
}

const TASKS: TaskItem[] = [
  { id: 't1', title: 'Design tasks API contract', status: 'Done' },
  { id: 't2', title: 'Scaffold node-svc', status: 'Done' },
  { id: 't3', title: 'Outbox pattern for task-events', status: 'Doing' },
  { id: 't4', title: 'Saga compensation on assign', status: 'Doing' },
  { id: 't5', title: 'e2e smoke — 15 steps', status: 'Todo' },
  { id: 't6', title: 'Saga demo fail@demo.local', status: 'Todo' },
];

function renderTask(task: TaskItem) {
  return (
    <span className="flex items-center justify-between gap-3">
      <span className="text-body text-ink">{task.title}</span>
      <span className="text-meta text-ink3">{task.status}</span>
    </span>
  );
}

/** Repeating rows from data — renderItem, pagination, loading skeleton. */
const meta = {
  title: 'Data Display/List',
  component: List,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  name: 'Basic — divider + header/footer',
  render: () => (
    <div className="w-96">
      <List
        items={TASKS}
        renderItem={renderTask}
        rowKey={(t) => t.id}
        header="My work"
        footer={`${TASKS.length} tasks total`}
      />
    </div>
  ),
};

export const LoadingEmpty: Story = {
  name: 'Loading skeleton + Empty',
  render: () => (
    <div className="flex w-96 flex-col gap-6">
      <div>
        <p className="mb-2 text-label text-ink3">Loading</p>
        <List items={TASKS} renderItem={renderTask} loading />
      </div>
      <div>
        <p className="mb-2 text-label text-ink3">Empty</p>
        <List items={[]} renderItem={renderTask} emptyText="No tasks yet" bordered />
      </div>
    </div>
  ),
};

export const Pagination: Story = {
  name: 'Bordered + pagination',
  render: () => (
    <div className="w-96">
      <List
        items={TASKS}
        renderItem={renderTask}
        rowKey={(t) => t.id}
        pagination={{ pageSize: 4 }}
        bordered
      />
    </div>
  ),
};

export const RichContent: Story = {
  name: 'Rich content — row as complex node (avatar + tag)',
  render: () => (
    <div className="w-96">
      <List
        items={TASKS}
        rowKey={(t) => t.id}
        header="Assignments"
        footer={`${TASKS.length} tasks total`}
        renderItem={(task) => (
          <span className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-pill bg-accent/10 text-meta font-semibold text-accent">
                {task.title.charAt(0)}
              </span>
              <span className="text-body text-ink">{task.title}</span>
            </span>
            <span className="text-meta text-ink3">{task.status}</span>
          </span>
        )}
      />
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="w-96 rounded-xl bg-canvas p-4">
      <List
        items={TASKS}
        renderItem={renderTask}
        rowKey={(t) => t.id}
        header="My work"
        footer={`${TASKS.length} tasks total`}
      />
    </div>
  ),
};

// ── Rich media 2026-10-25 — notification inbox như mọi app: icon/ảnh trái,
// title + snippet 1 dòng, time phải, Tag "Unread" cho hàng chưa đọc.

interface InboxNotification {
  id: string;
  /** Ảnh đại diện người gửi (photo seed) — có mặt = notification từ người. */
  who?: string;
  /** Icon hệ thống — dùng khi KHÔNG có `who` (deploy bot / cảnh báo). */
  systemIcon?: IconName;
  title: string;
  snippet: string;
  time: string;
  unread: boolean;
}

const INBOX: InboxNotification[] = [
  { id: 'n1', title: 'Alice mentioned you', snippet: '@you can you review the checkout fix before Friday?', time: '5m', unread: true, who: 'alice-avatar' },
  { id: 'n2', title: 'Bob assigned you “Payment webhook”', snippet: 'Due Monday — blocks the release train.', time: '32m', unread: true, who: 'bob-avatar' },
  { id: 'n3', systemIcon: 'check-circle', title: 'Deploy web@1.4.2 succeeded', snippet: 'All 15 smoke checks green in 4m 12s.', time: '1h', unread: true },
  { id: 'n4', title: 'Carol commented on API contract', snippet: 'Suggests renaming assigneeId → assignee — see thread.', time: '3h', unread: false, who: 'carol-avatar' },
  { id: 'n5', systemIcon: 'exclamation-triangle', title: 'Saga retry limit reached', snippet: 'assignment_failed for fail@demo.local — moved to DLQ.', time: '1d', unread: false },
  { id: 'n6', title: 'Dave closed “Safari login bug”', snippet: 'Fixed in 1.4.1 — token refresh on the right branch.', time: '2d', unread: false, who: 'dave-avatar' },
];

export const NotificationInbox: Story = {
  name: 'Notification inbox — avatars, snippets, unread tags',
  render: () => (
    <div className="w-96">
      <List
        bordered
        footer={`${INBOX.filter((n) => n.unread).length} unread of ${INBOX.length}`}
        header="Inbox"
        items={INBOX}
        renderItem={(n) => (
          <span className="flex items-start gap-3">
            {n.who ? (
              <Avatar alt={n.title} size={32} src={photo(n.who, 64, 64)} />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-pill bg-accent/10 text-accent"
              >
                <Icon name={n.systemIcon ?? 'bell'} size={14} />
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className={`truncate text-body ${n.unread ? 'font-semibold text-ink' : 'text-ink2'}`}>
                  {n.title}
                </span>
                {n.unread && <Tag>Unread</Tag>}
              </span>
              <span className="truncate text-label text-ink3">{n.snippet}</span>
            </span>
            <span className="shrink-0 pt-0.5 text-meta text-ink3">{n.time}</span>
          </span>
        )}
        rowKey={(n) => n.id}
      />
    </div>
  ),
};

/** CustomStyled — classNames slots (root/header/item/footer) + style passthrough (slots wave 3). */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="w-96">
      <List
        items={TASKS.slice(0, 3)}
        renderItem={(task) => (
          <span className="flex items-center justify-between gap-3">
            <span className="text-body text-ink">{task.title}</span>
            <span className="text-label text-ink3">{task.status}</span>
          </span>
        )}
        header="Styled list"
        footer="3 items"
        bordered
        style={{ padding: 8 }}
        classNames={{
          root: 'rounded-2xl',
          header: 'uppercase tracking-wide text-accent',
          item: 'hover:bg-s3 transition-colors',
          footer: 'text-right',
        }}
      />
    </div>
  ),
};
