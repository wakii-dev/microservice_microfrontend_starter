// PickList stories — two-column transfer (Transfer lite): pick in a column, then
// move with the chevron buttons; listboxes are keyboard-navigable (↑↓ + Enter/Space).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PickList } from './index';

const meta = {
  title: 'Forms/PickList',
  component: PickList,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

const STACKS = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Angular', value: 'angular' },
];

/** Basic — controlled: pick items → move ›/‹; picked list shown below. */
function BasicDemo() {
  const [source, setSource] = useState(STACKS);
  const [target, setTarget] = useState<typeof STACKS>([]);
  return (
      <div className="max-w-[560px]">
        <PickList source={source} target={target} onChange={(s, t) => { setSource(s); setTarget(t); }} />
        <p className="mt-2 font-mono text-meta text-ink3">
          picked: <strong className="text-ink">{target.map((t) => t.label).join(', ') || '—'}</strong>
        </p>
      </div>
  );
}

export const Basic: Story = {
  render: () => <BasicDemo />,
};

/** WithInitialTarget — start with items already moved. */
export const WithInitialTarget: Story = {
  name: 'With initial target',
  args: { source: [STACKS[0], STACKS[1]], target: [STACKS[2]] },
};

/** DarkTheme — panels on dark canvas. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="max-w-[560px] rounded-xl bg-canvas p-4">
      <PickList source={STACKS.slice(0, 2)} target={[]} onChange={() => {}} />
    </div>
  ),
};

/** Empty — empty source column (min-height keeps the panel shape). */
export const Empty: Story = {
  args: { source: [], target: STACKS },
};

/** CustomStyled — slots-wave classNames + style: `root` on the wrapper,
 * `panel`/`panelTitle`/`list`/`option` on both sides, `controls` on the middle
 * button column; `style` lands on the root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <PickList
      style={{ padding: 8, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
      classNames={{
        panelTitle: 'uppercase tracking-wide text-accent',
        list: 'rounded-2xl border-dashed border-accent',
        option: 'rounded-full',
      }}
      source={[
        { label: 'Read', value: 'read' },
        { label: 'Write', value: 'write' },
      ]}
      target={[{ label: 'Admin', value: 'admin' }]}
    />
  ),
};
