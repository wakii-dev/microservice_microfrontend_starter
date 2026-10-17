// Stories Mention — Forms. @autocomplete trong textarea.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Mention } from './index';

const meta = {
  title: 'Forms/Mention',
  component: Mention,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

const TEAM = ['Alice Nguyen', 'Binh Tran', 'Chi Le', 'Duong Pham', 'Giang Vo'];

function ControlledDemo() {
  const [value, setValue] = useState('');
  return (
    <div className="w-96">
      <Mention
        value={value}
        onChange={setValue}
        suggestions={TEAM}
        placeholder="Viết comment, gõ @ để mention…"
      />
      <p className="mt-2 text-meta text-ink3">value: {value || '—'}</p>
    </div>
  );
}

export const CoBan: Story = {
  name: 'Cơ bản — gõ @ → gợi ý → chọn',
  render: () => <ControlledDemo />,
};
