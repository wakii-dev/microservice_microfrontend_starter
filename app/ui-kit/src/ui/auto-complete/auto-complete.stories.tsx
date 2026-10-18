// AutoComplete stories — input + suggestion dropdown, pick → value.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AutoComplete } from './index';

const meta = {
  title: 'Forms/AutoComplete',
  component: AutoComplete,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

const TASKS = [
  { label: 'Learn TypeScript', value: 'ts' },
  { label: 'Learn Rust', value: 'rust' },
  { label: 'Write E2E tests', value: 'e2e' },
  { label: 'Fix nginx gateway', value: 'gateway' },
  { label: 'Saga compensation demo', value: 'saga' },
];

/** Basic — type to filter, click a suggestion to pick. */
export const Basic: Story = {
  args: { suggestions: TASKS, placeholder: 'Search tasks…' },
};

/** Controlled — useState demo: typed value + picked value displayed. */
export const Controlled: Story = {
  render: () => <AutoCompleteControlledDemo />,
};

/** Empty — no suggestions → dropdown never opens. */
export const Empty: Story = {
  name: 'Empty — no suggestions',
  args: { suggestions: [], placeholder: 'Nothing to suggest…' },
};

/** DarkTheme — input + open dropdown on dark canvas. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <div className="grid max-w-[320px] gap-3">
        <AutoComplete suggestions={TASKS.slice(0, 3)} placeholder="Search tasks…" />
      </div>
    </div>
  ),
};

function AutoCompleteControlledDemo() {
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState('');
  return (
    <div className="grid max-w-[320px] gap-3">
      <AutoComplete
        suggestions={TASKS}
        value={value}
        onChange={setValue}
        onSelect={setSelected}
        placeholder="Search tasks…"
      />
      <p className="m-0 font-mono text-meta text-ink3">
        value: <strong className="text-ink">{value || '—'}</strong> · selected: <strong className="text-ink">{selected || '—'}</strong>
      </p>
    </div>
  );
}
