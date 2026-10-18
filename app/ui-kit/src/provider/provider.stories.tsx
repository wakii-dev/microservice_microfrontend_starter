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
      <Badge variant="created">Created</Badge>
      <Badge variant="doing">Doing</Badge>
    </div>
  );
}

// Canvas-backed wrapper so surface tokens (--c-canvas) are visible in the demo.
function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: 'var(--c-canvas)', padding: 16 }}>{children}</div>;
}

export const LightDefault: Story = {
  args: { children: 'x' },
  name: 'Light (default)',
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
    <Canvas>
      <UiKitProvider theme="dark">
        <DemoContent />
      </UiKitProvider>
    </Canvas>
  ),
};

export const AccentOverride: Story = {
  args: { children: 'x' },
  name: 'Accent override (scaffold brand, one line)',
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

export const CustomTheme: Story = {
  name: 'CustomTheme — runtime tokens (purple accent + cream canvas)',
  args: { children: 'x' },
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <UiKitProvider theme={{ accent: '#7c3aed', accentHi: '#a78bfa', canvas: '#fdf6e3', s2: '#fffdf8', line: '#e7e5e4' }}>
        <Canvas>
          <DemoContent />
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink2)' }}>
            Button + badges inherit the runtime tokens via CSS var cascade — no re-render of the design system.
          </p>
        </Canvas>
      </UiKitProvider>
      <UiKitProvider theme={{ accent: '#0d9488', accentHi: '#2dd4bf', canvas: '#f0fdfa' }}>
        <Canvas>
          <DemoContent />
        </Canvas>
      </UiKitProvider>
    </div>
  ),
};
