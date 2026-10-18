// Parity matrix antd→tokens: docs/parity-matrix.md
// Modernize pass 2026-10-18 (vision-audit): thêm Sizes / Loading / Matrix —
// default h-9, rounded-lg, default variant bg-s2 (có định nghĩa trên nền trắng).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './index';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['primary', 'default', 'text'] },
    htmlType: { control: 'select', options: ['button', 'submit', 'reset'] },
    size: { control: 'select', options: ['small', 'middle', 'large'] },
    danger: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    block: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const CacType: Story = {
  args: { children: 'Button' },
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button type="primary">Tạo task</Button>
      <Button>Tải thêm</Button>
      <Button type="text">Huỷ</Button>
      <Button type="primary" disabled>
        Disabled
      </Button>
    </div>
  ),
};

export const NguoiDung: Story = {
  args: { children: 'Danger' },
  name: 'Danger',
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button type="primary" danger>
        Xác nhận xoá
      </Button>
      <Button type="text" danger>
        Xoá
      </Button>
    </div>
  ),
};

/** Sizes — small h-8 / middle h-9 (mặc định, 36px antd) / large h-10, cả 3 type. */
export const Sizes: Story = {
  name: 'Sizes (h-8 / h-9 / h-10)',
  args: { children: 'Button' },
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {(['small', 'middle', 'large'] as const).map((s) => (
        <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 48, fontSize: 12, opacity: 0.6 }}>{s}</span>
          <Button size={s} type="primary">
            Tạo task
          </Button>
          <Button size={s}>Tải thêm</Button>
          <Button size={s} type="text">
            Huỷ
          </Button>
        </div>
      ))}
    </div>
  ),
};

/** Loading — Spinner 3.5 thay icon, disable + cursor-wait; icon không hiện khi loading. */
export const Loading: Story = {
  args: { children: 'Loading' },
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button loading>Lưu</Button>
      <Button type="primary" loading>
        Lưu
      </Button>
      <Button type="primary" loading size="small">
        Small
      </Button>
      <Button type="primary">So sánh — bình thường</Button>
    </div>
  ),
};

/** Matrix đầy đủ — 3 type × {thường, danger, disabled, loading}. */
export const Matrix: Story = {
  name: 'Matrix (type × danger × disabled × loading)',
  args: { children: 'Matrix' },
  render: () => (
    <div style={{ display: 'grid', gap: 10 }}>
      {(['primary', 'default', 'text'] as const).map((t) => (
        <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button type={t}>{t}</Button>
          <Button type={t} danger>
            danger
          </Button>
          <Button type={t} disabled>
            disabled
          </Button>
          <Button type={t} loading>
            loading
          </Button>
        </div>
      ))}
    </div>
  ),
};
