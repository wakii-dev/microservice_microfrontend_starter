import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Password } from './index';

const meta = { title: 'Forms/Password', component: Password, tags: ['autodocs'] } satisfies Meta<typeof Password>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — password field with show/hide toggle. */
export const Basic: S = { args: { ariaLabel: 'Password', placeholder: 'Enter password' } };

/** WithStrength — strength meter on (weak/medium/strong via --st-* colors). */
export const WithStrength: S = {
  name: 'With strength meter',
  args: { ariaLabel: 'Password strength', placeholder: 'Type to see strength', showStrength: true, value: 'Strong1!' },
};

/** Disabled — locked field. */
export const Disabled: S = { args: { ariaLabel: 'Locked password', value: 'secret', disabled: true } };

/** Controlled — useState demo: toggle + type updates value. */
export const Controlled: S = {
  render: () => <PasswordControlledDemo />,
};

/** DarkTheme — field + meter on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="w-[320px] rounded-xl bg-canvas p-4">
      <Password ariaLabel="Password" placeholder="Enter password" showStrength value="Strong1!" />
    </div>
  ),
};

function PasswordControlledDemo() {
  const [v, setV] = useState('');
  return (
    <div className="grid max-w-[320px] gap-3">
      <Password value={v} onChange={setV} ariaLabel="Password" placeholder="Enter password" showStrength />
      <p className="m-0 font-mono text-meta text-ink3">length: <strong className="text-ink">{v.length}</strong></p>
    </div>
  );
}
