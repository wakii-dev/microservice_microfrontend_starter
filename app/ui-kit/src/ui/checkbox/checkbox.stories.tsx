import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './index';
const meta = { title: 'Forms/Checkbox', component: Checkbox, tags: ['autodocs'] } satisfies Meta<typeof Checkbox>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — unchecked. */
export const Basic: S = { args: { children: 'Remember me' } };

/** Group — multi-pick column of checkboxes (antd Checkbox.Group pattern, consumer-side). */
export const Group: S = {
  name: 'Group — multi-pick (consumer-side state)',
  render: () => <CheckboxGroupDemo />,
};

/** Checked — pressed state. */
export const Checked: S = { args: { checked: true, children: 'Selected' } };

/** Disabled — locked, dimmed. */
export const Disabled: S = { args: { disabled: true, children: 'Cannot check' } };

/** Controlled — useState demo: click label flips checked. */
export const Controlled: S = {
  render: () => <CheckboxControlledDemo />,
};

/** DarkTheme — both states on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="grid w-[280px] gap-3 rounded-xl bg-canvas p-4">
      <Checkbox>Remember me</Checkbox>
      <Checkbox checked>Selected</Checkbox>
      <Checkbox disabled>Cannot check</Checkbox>
    </div>
  ),
};

const STACKS = ['React', 'TypeScript', 'Rust'];

function CheckboxGroupDemo() {
  const [picked, setPicked] = useState<string[]>(['React']);
  const toggle = (name: string) =>
    setPicked((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  return (
    <div className="grid max-w-[320px] gap-3">
      <div role="group" aria-label="Stacks" className="grid gap-2">
        {STACKS.map((name) => (
          <Checkbox key={name} checked={picked.includes(name)} onChange={() => toggle(name)}>
            {name}
          </Checkbox>
        ))}
      </div>
      <p className="m-0 font-mono text-meta text-ink3">picked: <strong className="text-ink">{JSON.stringify(picked)}</strong></p>
    </div>
  );
}

function CheckboxControlledDemo() {
  const [on, setOn] = useState(false);
  return (
    <div className="grid max-w-[320px] gap-3">
      <Checkbox checked={on} onChange={setOn}>Enable autosave</Checkbox>
      <p className="m-0 font-mono text-meta text-ink3">checked: <strong className="text-ink">{String(on)}</strong></p>
    </div>
  );
}
