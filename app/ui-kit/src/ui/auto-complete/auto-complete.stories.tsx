// Stories AutoComplete — Forms. Input + suggestion dropdown, chọn → value.
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
  { label: 'Học TypeScript', value: 'ts' },
  { label: 'Học Rust', value: 'rust' },
  { label: 'Viết test E2E', value: 'e2e' },
  { label: 'Sửa gateway nginx', value: 'gateway' },
  { label: 'Saga compensation demo', value: 'saga' },
];

function ControlledDemo() {
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState('');
  return (
    <div className="w-80">
      <AutoComplete
        suggestions={TASKS}
        value={value}
        onChange={setValue}
        onSelect={setSelected}
        placeholder="Gõ để tìm task…"
      />
      <p className="mt-2 text-meta text-ink3">input: {value || '—'} · selected: {selected || '—'}</p>
    </div>
  );
}

export const CoBan: Story = {
  name: 'Cơ bản — gõ → gợi ý → chọn',
  render: () => <ControlledDemo />,
};
