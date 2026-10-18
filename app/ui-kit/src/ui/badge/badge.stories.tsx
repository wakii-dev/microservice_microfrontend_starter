// Parity matrix antd→tokens: docs/parity-matrix.md
// Badge stories — CẢ 9 variants (4 task status + 5 activity action) trên 1 canvas
// để so màu chấm/nền 12% alpha trực tiếp (docs sống thay screenshot ad-hoc).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, type BadgeVariant } from './index';

/** Small count/status marker for icons and labels. */
const meta = {
  title: 'Data Display/Badge',
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

// ── Count mode (antd Badge) — EN stories cho case-coverage audit ──

const slot = <span className="block size-8 rounded-lg bg-s3" aria-hidden="true" />;

export const CountOnAvatar: Story = {
  name: 'Count — wraps children at top-right corner',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <Badge count={5}>{slot}</Badge>
      <Badge count={12} offset={[-4, 4]}>{slot}</Badge>
      <Badge count={5}>Inbox</Badge>
    </div>
  ),
};

export const CountOverflow: Story = {
  name: 'Count — overflow 99+ (overflowCount custom)',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <Badge count={150}>{slot}</Badge>
      <Badge count={150} overflowCount={10}>{slot}</Badge>
    </div>
  ),
};

export const CountZeroAndDot: Story = {
  name: 'Count — showZero + dot (no number)',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <Badge count={0}>{slot}</Badge>
      <Badge count={0} showZero>{slot}</Badge>
      <Badge dot>{slot}</Badge>
    </div>
  ),
};

export const StandaloneStatus: Story = {
  name: 'Status — standalone dot + text (no children)',
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <Badge status="success" text="Done" />
      <Badge status="processing" text="Running" />
      <Badge status="error" text="Failed" />
      <Badge status="warning" text="Needs review" />
      <Badge status="default" text="Draft" />
    </div>
  ),
};
