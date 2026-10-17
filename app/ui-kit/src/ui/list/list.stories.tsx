// Stories List — Data Display. Parity antd List (renderItem/divider/bordered/
// pagination/loading skeleton/empty→EmptyState).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { List } from './index';

interface TaskItem {
  id: string;
  title: string;
  status: string;
}

const TASKS: TaskItem[] = [
  { id: 't1', title: 'Thiết kế contract tasks API', status: 'Xong' },
  { id: 't2', title: 'Scaffold node-svc', status: 'Xong' },
  { id: 't3', title: 'Outbox pattern cho task-events', status: 'Đang làm' },
  { id: 't4', title: 'Saga compensation assign', status: 'Đang làm' },
  { id: 't5', title: 'e2e smoke 15 bước', status: 'Cần làm' },
  { id: 't6', title: 'Saga demo fail@demo.local', status: 'Cần làm' },
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

export const ListCoBan: Story = {
  name: 'Cơ bản — divider + header/footer',
  render: () => (
    <div className="w-96">
      <List
        items={TASKS}
        renderItem={renderTask}
        rowKey={(t) => t.id}
        header="Việc của tôi"
        footer={`Tổng ${TASKS.length} việc`}
      />
    </div>
  ),
};

export const ListLoadingEmpty: Story = {
  name: 'Loading skeleton + Empty',
  render: () => (
    <div className="flex w-96 flex-col gap-6">
      <div>
        <p className="mb-2 text-label text-ink3">Loading</p>
        <List items={TASKS} renderItem={renderTask} loading />
      </div>
      <div>
        <p className="mb-2 text-label text-ink3">Empty</p>
        <List items={[]} renderItem={renderTask} emptyText="Chưa có việc nào" bordered />
      </div>
    </div>
  ),
};

export const ListPhanTrang: Story = {
  name: 'Bordered + phân trang',
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
