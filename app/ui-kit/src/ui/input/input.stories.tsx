// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, Textarea } from './index';
import { Icon } from '../icons/index';

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

/** Sizes — h-6 / h-8 (default) / h-10, same scale as Select/Button. */
export const Sizes: Story = {
  name: 'Sizes — small / middle / large',
  render: () => (
    <div className="grid max-w-[320px] gap-3">
      <Input size="small" aria-label="Small size" placeholder="Small (h-6)" />
      <Input aria-label="Middle size" placeholder="Middle (h-8, default)" />
      <Input size="large" aria-label="Large size" placeholder="Large (h-10)" />
    </div>
  ),
};

/** Affix — prefix icon / suffix text inside one bordered wrapper (antd affix pattern). */
export const Affix: Story = {
  name: 'Affix — prefix icon + suffix text',
  render: () => (
    <div className="grid max-w-[320px] gap-3">
      <Input aria-label="Search tasks" prefix={<Icon name="search" size={14} />} placeholder="Search tasks…" />
      <Input aria-label="Weight" suffix="kg" placeholder="0" />
    </div>
  ),
};

/** AllowClear — shows the × button once there is a value; click clears (controlled). */
export const AllowClear: Story = {
  name: 'AllowClear — × clears the value (controlled)',
  render: () => <InputAllowClearDemo />,
};

/** Disabled — locked, dimmed canvas. */
export const Disabled: Story = {
  args: { 'aria-label': 'Locked input', value: 'Managed by your organization', disabled: true },
};

/** TextareaCount — showCount + maxLength renders a N/M counter below. */
export const TextareaCount: Story = {
  name: 'Textarea — showCount + maxLength',
  render: () => <TextareaCountDemo />,
};

function InputAllowClearDemo() {
  const [v, setV] = useState('Type then clear…');
  return (
    <div className="grid max-w-[320px] gap-3">
      <Input aria-label="Clearable input" allowClear value={v} onChange={(e) => setV(e.target.value)} placeholder="Type something…" />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v || '—'}</strong></p>
    </div>
  );
}

function TextareaCountDemo() {
  const [v, setV] = useState('');
  return (
    <Textarea
      aria-label="Short bio"
      value={v}
      onChange={(e) => setV(e.target.value)}
      maxLength={120}
      showCount
      rows={3}
      placeholder="Tell us about yourself…"
    />
  );
}
