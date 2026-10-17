// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, Textarea } from './index';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof meta>;

export const CoBan: Story = {
  args: { 'aria-label': 'Tiêu đề', placeholder: 'Nhập tiêu đề…' },
};

export const Invalid: Story = {
  args: { 'aria-label': 'Email', placeholder: 'email@demo.local', invalid: true },
};

export const VungNhapNhieuDong: Story = {
  name: 'Textarea',
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
      <Textarea aria-label="Mô tả" placeholder="Mô tả…" />
      <Textarea aria-label="Lỗi" placeholder="Mô tả…" invalid />
    </div>
  ),
};
