// CascadeSelect stories — hierarchical picking (Cascader lite): level 0 → child
// → leaf; keyboard ↑↓/Enter/Esc works on the trigger.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CascadeSelect, type CascadeOption } from './index';

const meta = {
  title: 'Forms/CascadeSelect',
  component: CascadeSelect,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

const TREE: CascadeOption[] = [
  {
    label: 'Hanoi',
    value: 'hn',
    children: [
      { label: 'Ba Dinh', value: 'hn-bd' },
      { label: 'Tay Ho', value: 'hn-th' },
      { label: 'Cau Giay', value: 'hn-cg' },
    ],
  },
  {
    label: 'TP.HCM',
    value: 'hcm',
    children: [
      { label: 'District 1', value: 'hcm-1' },
      { label: 'District 3', value: 'hcm-3' },
    ],
  },
  { label: 'Da Nang', value: 'dn' },
];

function BasicDemo() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <div className="grid max-w-[320px] gap-3">
      <CascadeSelect options={TREE} value={value} onChange={setValue} placeholder="Pick a location…" />
      <p className="m-0 font-mono text-meta text-ink3">
        path: <strong className="text-ink">{value.length > 0 ? value.join(' / ') : '—'}</strong>
      </p>
    </div>
  );
}

/** Basic — controlled: pick level 0 → child → leaf; path shown below. */
export const Basic: Story = {
  render: () => <BasicDemo />,
};

const DEEP_TREE: CascadeOption[] = [
  {
    label: 'North',
    value: 'north',
    children: [
      {
        label: 'Hanoi',
        value: 'hn',
        children: [
          { label: 'Ba Dinh', value: 'hn-bd' },
          { label: 'Tay Ho', value: 'hn-th' },
        ],
      },
    ],
  },
  {
    label: 'Center',
    value: 'center',
    children: [{ label: 'Da Nang', value: 'dn', children: [{ label: 'Hai Chau', value: 'dn-hc' }] }],
  },
];

function DeepTreeDemo() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <div className="grid max-w-[320px] gap-3">
      <CascadeSelect options={DEEP_TREE} value={value} onChange={setValue} placeholder="Pick region → city → ward…" />
      <p className="m-0 font-mono text-meta text-ink3">
        path: <strong className="text-ink">{value.length > 0 ? value.join(' / ') : '—'}</strong>
      </p>
    </div>
  );
}

/** WithDeepTree — 3 levels (region → city → ward) for nested navigation. */
export const WithDeepTree: Story = {
  name: 'With deep tree — 3 levels',
  render: () => <DeepTreeDemo />,
};

function PreselectedDemo() {
  const [value, setValue] = useState<string[]>(['hn', 'hn-th']);
  return (
    <div className="grid max-w-[320px] gap-3">
      <CascadeSelect options={TREE} value={value} onChange={setValue} placeholder="Pick a location…" />
      <p className="m-0 font-mono text-meta text-ink3">
        path: <strong className="text-ink">{value.length > 0 ? value.join(' / ') : '—'}</strong>
      </p>
    </div>
  );
}

/** Preselected — initial value path renders on the trigger without picking. */
export const Preselected: Story = {
  name: 'Preselected — initial value path (Hanoi / Tay Ho)',
  render: () => <PreselectedDemo />,
};

/** DarkTheme — trigger + open panel on dark canvas. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <div className="max-w-[280px]">
        <CascadeSelect options={TREE} placeholder="Pick a location…" onChange={() => {}} />
      </div>
    </div>
  ),
};

/** Empty — options=[]: panel opens with nothing to pick (edge). */
export const Empty: Story = {
  args: { options: [], placeholder: 'Nothing to pick…' },
};

/* ── Customize pass (slots wave 3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / trigger / panel / option)
 * + style passthrough. `root` lands on the outer relative div (same element as
 * `className`), `trigger` on the trigger button, `panel` on the floating listbox
 * frame, `option` on every option button; `style` lands on the root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="max-w-[280px]">
      <CascadeSelect
        options={TREE}
        placeholder="Pick a location…"
        onChange={() => {}}
        classNames={{
          root: 'rounded-xl',
          trigger: 'border-st-done border-dashed',
          panel: 'rounded-lg border-st-done',
          option: 'tracking-wide',
        }}
        style={{ padding: 6, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
      />
    </div>
  ),
};
