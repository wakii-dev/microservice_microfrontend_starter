import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './index';
const meta = { title: 'Data Display/Avatar', component: Avatar, tags: ['autodocs'] } satisfies Meta<typeof Avatar>;
export default meta;
type S = StoryObj<typeof meta>;

export const Basic: S = { name: 'Basic — letter', args: { children: 'A' } };
export const Image: S = { name: 'Image — src + alt', args: { src: 'https://i.pravatar.cc/150?img=1', alt: 'user' } };
export const Square48: S = { name: 'Square 48', args: { children: 'B', size: 48, shape: 'square' } };

export const Sizes: S = {
  name: 'Sizes — 24/32/48/64 (circle + square)',
  render: () => (
    <div className="flex items-end gap-4">
      {[24, 32, 48, 64].map((s) => (
        <Avatar key={`c${s}`} size={s}>
          {s}
        </Avatar>
      ))}
      {[24, 32, 48, 64].map((s) => (
        <Avatar key={`s${s}`} size={s} shape="square">
          {s}
        </Avatar>
      ))}
    </div>
  ),
};

export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="flex w-fit gap-3 rounded-xl bg-canvas p-4">
      <Avatar>VN</Avatar>
      <Avatar src="https://i.pravatar.cc/150?img=3" alt="user 3" size={48} />
      <Avatar size={48} shape="square">
        QT
      </Avatar>
    </div>
  ),
};

// ── Case-coverage audit 2026-10-18 (antd parity: src error fallback) ──

export const BrokenSrcFallback: S = {
  name: 'Broken src — falls back to initials on error',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar src="https://example.com/missing.jpg" alt="Hai">HB</Avatar>
      <Avatar src="https://example.com/missing.jpg" alt="Team" shape="square">TM</Avatar>
      <span className="text-meta text-ink2">← initials replace broken images</span>
    </div>
  ),
};
