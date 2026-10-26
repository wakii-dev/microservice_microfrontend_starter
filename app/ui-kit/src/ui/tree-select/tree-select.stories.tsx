// TreeSelect stories — Forms. Leaf-only selection, 'Parent / Child' path,
// search by label + path, clearable, disabled.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeSelect, type TreeNode } from './index';

/** Pick one leaf from a hierarchy — searchable, clearable, path shown as 'A / B'. */
const meta = {
  title: 'Forms/TreeSelect',
  component: TreeSelect,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

const DEPARTMENTS: TreeNode[] = [
  {
    value: 'fe',
    label: 'Frontend',
    children: [
      { value: 'fe-ui', label: 'UI Kit' },
      { value: 'fe-web', label: 'Web App' },
    ],
  },
  {
    value: 'be',
    label: 'Backend',
    children: [
      { value: 'be-node', label: 'Node Services' },
      { value: 'be-java', label: 'Java Services' },
      { value: 'be-go', label: 'Go Services' },
    ],
  },
  { value: 'qa', label: 'QA' },
];

function ControlledDemo() {
  const [value, setValue] = useState<string | undefined>();
  return (
    <div className="w-72">
      <TreeSelect
        ariaLabel="Department"
        treeData={DEPARTMENTS}
        value={value}
        onChange={setValue}
        placeholder="Select department…"
      />
      {value && <p className="mt-2 text-label text-ink3">value: {value}</p>}
    </div>
  );
}

export const Basic: Story = {
  name: 'Basic — leaf selection, path, search',
  render: () => <ControlledDemo />,
};

const ORG_TREE: TreeNode[] = [
  {
    value: 'company',
    label: 'Company',
    children: [
      {
        value: 'rd',
        label: 'R&D',
        children: [
          { value: 'fe', label: 'Frontend' },
          { value: 'be', label: 'Backend' },
        ],
      },
      { value: 'ops', label: 'Operations' },
    ],
  },
];

/** DeepPath — 3-level hierarchy; trigger shows the full 'Company / R&D / Frontend' path. */
export const DeepPath: Story = {
  name: 'Deep path — 3 levels shown as Company / R&D / Frontend',
  args: { ariaLabel: 'Org unit', treeData: ORG_TREE, value: 'fe' },
};

export const NoSearch: Story = {
  name: 'searchable=false — panel without search box',
  args: { ariaLabel: 'Department', treeData: DEPARTMENTS, searchable: false, placeholder: 'Select department…' },
};

export const NoClear: Story = {
  name: 'clearable=false — has value but no × button',
  args: { ariaLabel: 'Department', treeData: DEPARTMENTS, value: 'be-node', clearable: false },
};

export const Disabled: Story = {
  name: 'Disabled — panel won’t open, s3 background',
  args: { ariaLabel: 'Department (disabled)', treeData: DEPARTMENTS, value: 'fe-ui', disabled: true },
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-s2 p-4">
      <ControlledDemo />
    </div>
  ),
};

/* ── Customize pass (slots wave 3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / trigger / panel /
 * listbox / option) + style passthrough. `root` lands on the outer relative
 * span (same element as `className`), `trigger` on the combobox button,
 * `panel`/`listbox`/`option` inside the dropdown; `style` lands on the root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  args: { ariaLabel: 'Custom', treeData: [] },
  render: () => (
    <div className="grid max-w-[320px] gap-4">
      <TreeSelect
        ariaLabel="Custom styled tree select"
        treeData={DEPARTMENTS}
        classNames={{
          root: 'rounded-xl',
          trigger: 'border-st-done border-dashed',
          panel: 'rounded-lg border-st-done',
          listbox: 'bg-accent/5',
          option: 'tracking-wide',
        }}
        style={{ padding: 6, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
      />
    </div>
  ),
};
