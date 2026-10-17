// Stories TreeSelect — Forms. Chọn leaf, đường dẫn 'Cha / Con', search label +
// đường dẫn, clearable.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeSelect, type TreeNode } from './index';

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
        ariaLabel="Phòng ban"
        treeData={DEPARTMENTS}
        value={value}
        onChange={setValue}
        placeholder="Chọn phòng ban…"
      />
      {value && <p className="mt-2 text-meta text-ink3">value: {value}</p>}
    </div>
  );
}

export const TreeSelectCoBan: Story = {
  name: 'Cơ bản — chọn leaf, đường dẫn, search',
  render: () => <ControlledDemo />,
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <ControlledDemo />
    </div>
  ),
};
