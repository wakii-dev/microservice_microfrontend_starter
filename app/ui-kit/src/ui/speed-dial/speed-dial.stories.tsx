import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpeedDial } from './index';
// Không set component (icon/actions required → story buộc args) — render-only stories.
const meta = { title: 'Navigation/SpeedDial', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;
export const Basic: S = {
  name: 'Basic — FAB + radiating actions',
  render: () => (
    <SpeedDial
      icon="+"
      actions={[
        { key: 'a', icon: '📝', label: 'Create' },
        { key: 'b', icon: '📁', label: 'Browse' },
      ]}
    />
  ),
};

export const FixedPosition: S = {
  name: 'Fixed — bottom-right of the viewport',
  render: () => (
    <div className="relative h-64 rounded-xl border border-line bg-s2">
      <SpeedDial
        icon="+"
        actions={[
          { key: 'new', icon: '📝', label: 'New task' },
          { key: 'folder', icon: '📁', label: 'New folder' },
        ]}
      />
    </div>
  ),
};
