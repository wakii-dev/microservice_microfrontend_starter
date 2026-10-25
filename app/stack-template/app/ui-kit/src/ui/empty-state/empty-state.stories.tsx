// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './index';

/** Placeholder for no-data sections — icon, title, action slot. */
const meta = {
  title: 'Data Display/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;
export default meta;

type Story = StoryObj<typeof meta>;

export const VoiMoTa: Story = {
  args: {
    title: 'Chưa có task nào',
    description: 'Tạo task đầu tiên ở form trên.',
  },
};

export const KhongMoTa: Story = {
  args: { title: 'Chưa có sự kiện nào' },
};

/** CustomStyled — classNames slots (root/image/title/description/action) + style passthrough (slots wave 3). */
export const CustomStyled: StoryObj = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="flex justify-center">
      <EmptyState
        title="Nothing here yet"
        description="Create your first task to get started."
        action={<button type="button" className="rounded-lg border border-line bg-s2 px-4 py-2 text-body">Create task</button>}
        image={<div className="size-16 rounded-full border-2 border-dashed border-line2 bg-s3" />}
        style={{ padding: 24 }}
        classNames={{
          root: 'rounded-xl border border-line bg-s2',
          title: 'text-headline font-semibold text-accent',
          description: 'text-ink3',
        }}
      />
    </div>
  ),
};
