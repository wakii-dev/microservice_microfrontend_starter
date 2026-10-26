import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpeedDial } from './index';
// Không set component (icon/actions required → story buộc args) — render-only stories.
/** FAB that radiates quick actions on open. */
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

/** CustomStyled — slots-wave classNames + style: `root` lands on the fixed
 * stack, `action` on each radiating button, `trigger` on the FAB; `style`
 * lands on the stack. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="relative h-64 rounded-xl border border-line bg-s2">
      <SpeedDial
        icon="+"
        actions={[
          { key: 'new', icon: '📝', label: 'New task' },
          { key: 'folder', icon: '📁', label: 'New folder' },
        ]}
        classNames={{
          root: 'bottom-6 right-16',
          action: 'border-dashed border-accent bg-accent/5',
          trigger: 'ring-2 ring-accent/40',
        }}
        style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)' }}
      />
    </div>
  ),
};
