// List stories — Data Display. antd List parity (renderItem/divider/bordered/
// pagination/loading skeleton/empty→EmptyState).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { List } from './index';

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
