// Stories PickList — Forms. 2 cột chuyển item qua lại (Transfer lite).
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

function ControlledDemo() {
  const [source, setSource] = useState(STACKS);
  const [target, setTarget] = useState<typeof STACKS>([]);
  return (
    <div>
      <PickList
        source={source}
        target={target}
        onChange={(s, t) => { setSource(s); setTarget(t); }}
      />
      <p className="mt-2 text-meta text-ink3">
        đã chọn: {target.map((t) => t.label).join(', ') || '—'}
      </p>
    </div>
  );
}

export const CoBan: Story = {
  name: 'Cơ bản — pick › chuyển sang, ‹ chuyển về',
  render: () => <ControlledDemo />,
};
