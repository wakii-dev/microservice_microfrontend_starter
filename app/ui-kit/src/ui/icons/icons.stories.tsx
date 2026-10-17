// icons.stories.tsx — section Primitives/Icons: lưới TẤT CẢ icon + size variants.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, ICON_NAMES } from './index';

const meta = { title: 'Primitives/Icons', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

export const AllIcons: S = {
  name: 'Tất cả icon (48)',
  render: () => (
    <div className="grid grid-cols-8 gap-2">
      {ICON_NAMES.map((name) => (
        <div key={name} className="flex flex-col items-center gap-1 rounded-lg border border-line bg-s2 p-2">
          <Icon name={name} size={20} className="text-ink" />
          <span className="text-[10px] text-ink2">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const IconSizes: S = {
  name: 'Size variants — 12 → 32',
  render: () => (
    <div className="flex items-end gap-4">
      {[12, 14, 16, 20, 24, 32].map((size) => (
        <div key={size} className="flex flex-col items-center gap-1">
          <Icon name="settings" size={size} className="text-ink" />
          <span className="text-meta text-ink3">{size}px</span>
        </div>
      ))}
    </div>
  ),
};
