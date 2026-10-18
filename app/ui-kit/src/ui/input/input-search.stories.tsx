// Input.Search stories — antd parity (docs/parity-matrix.md Gap P0).
// Matrix: basic icon · enterButton (boolean + node) · sizes · loading · invalid/disabled.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Input } from './index';

const meta = {
  title: 'Primitives/Input Search',
  component: Input.Search,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['small', 'middle', 'large'] },
    enterButton: { control: 'boolean' },
    loading: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
} satisfies Meta<typeof Input.Search>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Basic — ghost search icon on the right; Enter or click fires onSearch. */
export const Basic: Story = {
  args: { placeholder: 'Search tasks…' },
  render: (args) => (
    <div className="w-80">
      <Input.Search {...args} onSearch={(v) => console.log('search:', v)} />
    </div>
  ),
};

/** EnterButton — true renders a primary icon button; a ReactNode renders a default button with that content. */
export const EnterButton: Story = {
  render: () => (
    <div className="grid w-96 gap-3">
      <Input.Search placeholder="enterButton (boolean) → primary icon" enterButton />
      <Input.Search placeholder='enterButton="Search" (node) → default button' enterButton="Search" />
    </div>
  ),
};

/** Sizes — small h-6 / middle h-8 (default) / large h-10, same scale as Input. */
export const Sizes: Story = {
  render: () => (
    <div className="grid w-96 gap-3">
      {(['small', 'middle', 'large'] as const).map((s) => (
        <div key={s} className="flex items-center gap-3">
          <span className="w-14 text-label text-ink3">{s}</span>
          <Input.Search size={s} placeholder={`Search (${s})…`} enterButton="Go" />
        </div>
      ))}
    </div>
  ),
};

/** Loading — spinner replaces the icon; further Enter/clicks are blocked until loading clears. */
export const Loading: Story = {
  render: () => <div className="w-80"><Input.Search placeholder="Fetching…" loading enterButton /></div>,
};

/** States — invalid (red border + ring) and disabled side by side. */
export const States: Story = {
  render: () => (
    <div className="grid w-96 gap-3">
      <Input.Search placeholder="Invalid state" invalid />
      <Input.Search placeholder="Disabled" disabled enterButton="Search" />
    </div>
  ),
};

/** Demo component cho OnSearch — hooks phải nằm trong component thật (rules-of-hooks). */
function OnSearchDemo() {
  const [last, setLast] = useState('');
  return (
    <div className="w-80">
      <Input.Search placeholder="Filter by title…" enterButton onSearch={setLast} />
      <p className="mt-2 text-label text-ink3">Last search: {last || '—'}</p>
    </div>
  );
}

/** OnSearch — controlled demo: last searched value shown below the field. */
export const OnSearch: Story = {
  render: () => <OnSearchDemo />,
};
