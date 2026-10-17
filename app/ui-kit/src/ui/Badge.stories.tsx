// Badge stories — CẢ 9 variants (4 task status + 5 activity action) trên 1 canvas
// để so màu chấm/nền 12% alpha trực tiếp (docs sống thay screenshot ad-hoc).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, type BadgeVariant } from './Badge';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['todo', 'doing', 'done', 'failed', 'created', 'updated', 'assigned', 'deleted', 'assignmentFailed'] },
  },
} satisfies Meta<typeof Badge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const TaskStatuses: Story = {
  args: { variant: 'todo', children: 'Cần làm' },
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Badge variant="todo">Cần làm</Badge>
      <Badge variant="doing">Đang làm</Badge>
      <Badge variant="done">Xong</Badge>
      <Badge variant="failed">Gán thất bại</Badge>
    </div>
  ),
};

export const ActivityActions: Story = {
  args: { variant: 'created', children: 'đã tạo' },
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Badge variant="created">đã tạo</Badge>
      <Badge variant="updated">đã cập nhật</Badge>
      <Badge variant="assigned">đã giao</Badge>
      <Badge variant="deleted">đã xoá</Badge>
      <Badge variant="assignmentFailed">gán thất bại</Badge>
    </div>
  ),
};

export const TatCaVariants: Story = {
  args: { variant: 'todo', children: 'todo' },
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {(['todo', 'doing', 'done', 'failed', 'created', 'updated', 'assigned', 'deleted', 'assignmentFailed'] as BadgeVariant[]).map((v) => (
        <Badge key={v} variant={v}>
          {v}
        </Badge>
      ))}
    </div>
  ),
};
