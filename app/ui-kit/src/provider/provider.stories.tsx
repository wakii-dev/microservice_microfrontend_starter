import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../ui/badge/index';
import { Button } from '../ui/button/index';
import { UiKitProvider } from './index';

const meta = {
  title: 'Theming/UiKitProvider',
  component: UiKitProvider,
  tags: ['autodocs'],
} satisfies Meta<typeof UiKitProvider>;
export default meta;

type Story = StoryObj<typeof meta>;

function DemoContent() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button type="primary">Primary</Button>
      <Badge variant="created">đã tạo</Badge>
      <Badge variant="doing">Đang làm</Badge>
    </div>
  );
}

export const LightDefault: Story = {
  args: { children: 'x' },
  render: () => (
    <UiKitProvider>
      <DemoContent />
    </UiKitProvider>
  ),
};

export const DarkDirectionB: Story = {
  args: { children: 'x' },
  name: 'Dark (direction B)',
  render: () => (
    <div style={{ background: 'var(--c-canvas)', padding: 16 }}>
      <UiKitProvider theme="dark">
        <DemoContent />
      </UiKitProvider>
    </div>
  ),
};

export const AccentOverride: Story = {
  args: { children: 'x' },
  name: 'Accent override (scaffold brand 1 dòng)',
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <UiKitProvider accent="#1677ff" accentHover="#4096ff">
        <DemoContent />
      </UiKitProvider>
      <UiKitProvider accent="#e11d48" accentHover="#fb7185">
        <DemoContent />
      </UiKitProvider>
    </div>
  ),
};
