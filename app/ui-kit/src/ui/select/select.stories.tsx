// Select stories — states: selected/placeholder/disabled.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './index';

const meta = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;
export default meta;

type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { label: 'Cần làm', value: 'todo' },
  { label: 'Đang làm', value: 'in_progress' },
  { label: 'Xong', value: 'done' },
];

function OursSelected() {
  const [value, setValue] = useState<string>('todo');
  return <Select ariaLabel="Parity select — selected" options={OPTIONS} value={value} onChange={(v) => setValue(String(v))} />;
}

export const Selected: Story = {
  args: { ariaLabel: 'S', options: OPTIONS, value: 'todo' },
  render: () => <OursSelected />,
};
export const Placeholder: Story = {
  args: { ariaLabel: 'Parity select — placeholder', options: OPTIONS, placeholder: 'Chọn trạng thái…' },
};

// ── Coverage audit additions (antd Select parity) — EN demos ────────────────────

const TASK_OPTIONS = [
  { label: 'Learn TypeScript', value: 'ts' },
  { label: 'Learn Rust', value: 'rust' },
  { label: 'Write E2E tests', value: 'e2e' },
  { label: 'Fix nginx gateway', value: 'gateway' },
  { label: 'Saga compensation demo', value: 'saga' },
  { label: 'Seed demo users', value: 'seed' },
];

/** Filterable — type in the panel to narrow options (antd showSearch). */
export const Filterable: Story = {
  name: 'Filterable — type to search options',
  args: { ariaLabel: 'Filterable select', options: TASK_OPTIONS, filterable: true, placeholder: 'Pick a task…' },
};

/** Multiple — chips + select-all/clear-all inside the panel (antd mode="multiple"). */
export const Multiple: Story = {
  name: 'Multiple — chips + select all',
  args: { ariaLabel: 'Multiple select', options: OPTIONS },
  render: () => <SelectMultipleDemo />,
};

/** MaxSelectedCount — chips overflow folds into "+N" (antd maxTagCount). */
export const MaxSelectedCount: Story = {
  name: 'MaxSelectedCount — overflow becomes +N',
  args: { ariaLabel: 'Capped multiple select', options: OPTIONS },
  render: () => <SelectMaxSelectedDemo />,
};

/** OptionGroups — grouped headers inside the panel (antd options with options). */
export const OptionGroups: Story = {
  name: 'Option groups — grouped panel',
  args: {
    ariaLabel: 'Grouped select',
    placeholder: 'Pick a service…',
    options: [
      {
        label: 'Frontend',
        value: 'group-fe',
        items: [
          { label: 'Shell (host)', value: 'shell' },
          { label: 'Tasks remote', value: 'tasks' },
        ],
      },
      {
        label: 'Backend',
        value: 'group-be',
        items: [
          { label: 'node-svc', value: 'node' },
          { label: 'go-svc', value: 'go' },
        ],
      },
    ],
  },
};

/** Disabled — trigger locked, no panel. */
export const Disabled: Story = {
  args: { ariaLabel: 'Parity select — disabled', options: OPTIONS, value: 'todo', disabled: true },
};

/** Loading — spinner replaces the option list (antd loading). */
export const Loading: Story = {
  name: 'Loading — spinner in panel',
  args: { ariaLabel: 'Loading select', options: TASK_OPTIONS, loading: true },
};

/** ShowClear — × next to the chevron clears the value (antd allowClear). */
export const ShowClear: Story = {
  name: 'ShowClear — × clears the value',
  args: { ariaLabel: 'Clearable select', options: OPTIONS },
  render: () => <SelectShowClearDemo />,
};

/** Editable — trigger stays typable while the panel is open (free value). */
export const Editable: Story = {
  name: 'Editable — free-text value',
  args: { ariaLabel: 'Editable select', options: TASK_OPTIONS, editable: true, placeholder: 'Pick or type…' },
};

/** OptionDisabled — one locked option (antd disabled option). */
export const OptionDisabled: Story = {
  name: 'Option disabled — one locked option',
  args: {
    ariaLabel: 'Select with disabled option',
    options: [
      { label: 'Available plan', value: 'free' },
      { label: 'Legacy plan', value: 'legacy', disabled: true },
      { label: 'Enterprise plan', value: 'ent' },
    ],
    placeholder: 'Pick a plan…',
  },
};

/** DarkTheme — trigger + open panel on dark canvas. */
export const DarkTheme: Story = {
  name: 'DarkTheme — trigger + panel on dark canvas',
  args: { ariaLabel: 'Dark select', options: OPTIONS },
  render: () => (
    <div data-bp-theme="dark" className="w-72 rounded-xl bg-canvas p-4">
      <Select ariaLabel="Dark select" options={OPTIONS} value="in_progress" />
    </div>
  ),
};

function SelectMultipleDemo() {
  const [values, setValues] = useState<string[]>(['todo']);
  return (
    <div className="grid max-w-[320px] gap-3">
      <Select ariaLabel="Multiple select" options={OPTIONS} multiple value={values} onChange={(v) => setValues(Array.isArray(v) ? v : [v])} placeholder="Pick statuses…" />
      <p className="m-0 font-mono text-meta text-ink3">values: <strong className="text-ink">{JSON.stringify(values)}</strong></p>
    </div>
  );
}

function SelectMaxSelectedDemo() {
  const [values, setValues] = useState<string[]>(['todo', 'in_progress', 'done']);
  return (
    <div className="grid max-w-[320px] gap-3">
      <Select ariaLabel="Capped multiple select" options={OPTIONS} multiple maxSelectedCount={2} value={values} onChange={(v) => setValues(Array.isArray(v) ? v : [v])} placeholder="Pick statuses…" />
      <p className="m-0 font-mono text-meta text-ink3">3 selected, max 2 chips → "+1"</p>
    </div>
  );
}

function SelectShowClearDemo() {
  const [value, setValue] = useState<string>('todo');
  return (
    <div className="grid max-w-[320px] gap-3">
      <Select ariaLabel="Clearable select" options={OPTIONS} showClear value={value} onChange={(v) => setValue(String(v))} placeholder="Pick a status…" />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{value || '—'}</strong></p>
    </div>
  );
}
