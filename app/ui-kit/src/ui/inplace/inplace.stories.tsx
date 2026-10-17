// Stories Inplace — Forms. Click-to-edit toggle.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inplace } from './index';

const meta = {
  title: 'Forms/Inplace',
  component: Inplace,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

function EditDemo() {
  const [name, setName] = useState('Alice');
  return (
    <Inplace display={`Tên: ${name}`}>
      <input
        aria-label="Sửa tên"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 rounded-2 border border-line bg-s2 px-2 text-body text-ink focus:border-accent-hi focus:outline-none"
      />
    </Inplace>
  );
}

export const CoBan: Story = {
  name: 'Cơ bản — click → sửa, ✕ → đóng',
  render: () => <EditDemo />,
};
