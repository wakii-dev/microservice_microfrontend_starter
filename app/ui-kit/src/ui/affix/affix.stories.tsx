// Affix stories — antd parity (docs/parity-matrix.md Gap P0).
// Sticky demo runs inside a real scroll container so the behavior is visible
// without leaving the story canvas. position: sticky is pure CSS; Affix only
// reports state changes through onChange.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Affix } from './index';

const meta = {
  title: 'Navigation/Affix',
  component: Affix,
  tags: ['autodocs'],
  argTypes: {
    offsetTop: { control: 'number' },
    offsetBottom: { control: 'number' },
  },
  // Bare Meta như table.stories.tsx — stories render-driven (children tự compose),
  // không khai báo args generics để tránh đòi args.children ở từng story.
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

function ScrollBox({ children, height = 240 }: { children: React.ReactNode; height?: number }) {
  const rows = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div className="rounded-xl border border-line bg-s1" style={{ height, overflowY: 'auto' }}>
      {children}
      <div className="grid gap-2 p-4">
        {rows.map((n) => (
          <div key={n} className="rounded-lg border border-line2 bg-s2 px-3 py-2 text-label text-ink2">
            Row {n} — scroll me
          </div>
        ))}
      </div>
    </div>
  );
}

const toolbarCls = 'rounded-lg border border-line bg-s2 px-3 py-1.5 text-label font-medium text-ink shadow-[var(--shadow-pop)]';

/** Demo component cho OnChange — hooks phải nằm trong component thật (rules-of-hooks). */
function OnChangeDemo() {
  const [affixed, setAffixed] = useState(false);
  return (
    <div className="w-96">
      <ScrollBox height={200}>
        <Affix offsetTop={8} onChange={setAffixed}>
          <div className={toolbarCls}>
            Status: <span className={affixed ? 'text-st-done' : 'text-ink3'}>{affixed ? 'affixed' : 'idle'}</span>
          </div>
        </Affix>
      </ScrollBox>
    </div>
  );
}

/** Basic — toolbar sticks to the top edge of the scroll container (offsetTop 0). */
export const Basic: Story = {
  args: { children: 'Toolbar' },
  render: () => (
    <div className="w-96">
      <ScrollBox>
        <Affix>
          <div className={toolbarCls}>Toolbar — sticks at top (offset 0)</div>
        </Affix>
      </ScrollBox>
    </div>
  ),
};

/** OffsetTop — the wrapper pins 12px below the container's top edge. */
export const OffsetTop: Story = {
  args: { children: 'Pinned bar' },
  render: () => (
    <div className="w-96">
      <ScrollBox>
        <Affix offsetTop={12}>
          <div className={toolbarCls}>Pinned 12px from top</div>
        </Affix>
      </ScrollBox>
    </div>
  ),
};

/** OffsetBottom — bottom mode: a footer bar pinned above the container's bottom edge. */
export const OffsetBottom: Story = {
  args: { children: 'Footer bar' },
  render: () => (
    <div className="w-96">
      <ScrollBox>
        <Affix offsetBottom={12}>
          <div className={toolbarCls}>Footer bar — pinned 12px from bottom</div>
        </Affix>
      </ScrollBox>
    </div>
  ),
};

/** OnChange — reports the affixed state; watch the badge flip while scrolling. */
export const OnChange: Story = {
  args: { children: 'Status bar' },
  render: () => <OnChangeDemo />,
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the sticky
 * wrapper; `style` merges after the sticky top/bottom inline styles. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  args: {
    offsetTop: 8,
    children: 'Sticky slotted bar',
    classNames: { root: 'rounded-xl border border-dashed border-accent bg-accent/5 px-3 py-2' },
    style: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' },
  },
};
