// Stories OrderList — Data Display. Danh sách reorder bằng ▲/▼.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { OrderList } from './index';

/** Reorderable list — move items up/down with chevrons or keyboard. */
const meta = {
  title: 'Data Display/OrderList',
  component: OrderList,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

const STEPS = [
  { label: 'Boot compose', value: 'boot' },
  { label: 'Tạo Kafka topic', value: 'topic' },
  { label: 'Chạy e2e smoke', value: 'e2e' },
  { label: 'Assert DLQ', value: 'dlq' },
];

function ControlledDemo() {
  const [items, setItems] = useState(STEPS);
  return (
    <div>
      <OrderList items={items} onChange={setItems} />
      <p className="mt-2 text-meta text-ink3">
        thứ tự: {items.map((s) => s.value).join(' → ')}
      </p>
    </div>
  );
}

export const CoBan: Story = {
  name: 'Basic — move up / down',
  render: () => <ControlledDemo />,
};
