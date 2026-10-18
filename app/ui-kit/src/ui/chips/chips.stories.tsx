// Chips stories — multi-value input with tags: Enter adds, × removes,
// Backspace removes the last one.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chips } from './index';

const meta = {
  title: 'Forms/Chips',
  component: Chips,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

/** Basic — type + Enter to add, × to remove one, Backspace removes the last. */
export const Basic: Story = {
  args: { value: ['react', 'typescript'], placeholder: 'Add tech…' },
};

/** Controlled — useState demo: values shown as JSON. */
export const Controlled: Story = {
  render: () => <ChipsControlledDemo />,
};

/** Empty — no values: only the placeholder input shows. */
export const Empty: Story = {
  args: { value: [], placeholder: 'Add first tag…' },
};

/** Disabled — input + remove buttons hidden. */
export const Disabled: Story = {
  args: { value: ['locked', 'tags'], disabled: true },
};

/** DarkTheme — chips + input on dark canvas. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="w-96 rounded-xl bg-canvas p-4">
      <Chips value={['react', 'rust', 'nginx']} onChange={() => {}} placeholder="Add tech…" />
    </div>
  ),
};

function ChipsControlledDemo() {
  const [value, setValue] = useState<string[]>(['react', 'typescript']);
  return (
    <div className="w-96">
      <Chips value={value} onChange={setValue} placeholder="Add tech…" />
      <p className="mt-2 font-mono text-meta text-ink3">values: {JSON.stringify(value)}</p>
    </div>
  );
}
