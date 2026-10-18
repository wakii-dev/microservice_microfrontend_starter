// Accordion stories — single-open (mặc định), multiple, controlled, disabled, first-open.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from './index';

const meta = {
  title: 'Primitives/Accordion',
  component: Accordion,
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;
export default meta;

type Story = StoryObj;

const ITEMS = [
  {
    key: 'shipping',
    label: 'Shipping & delivery',
    children: 'Standard delivery takes 2–4 business days. Express is next-day before 12:00.',
  },
  {
    key: 'returns',
    label: 'Returns policy',
    children: 'Free returns within 30 days. Items must be unused with original packaging.',
  },
  {
    key: 'warranty',
    label: 'Warranty',
    children: '24 months manufacturer warranty; extended plans available at checkout.',
  },
];

export const Basic: Story = {
  name: 'Basic — single-open (opening one closes the other)',
  render: () => <Accordion items={ITEMS} />,
};

export const FirstOpen: Story = {
  name: 'First open — defaultActiveKey pre-expands one panel',
  render: () => <Accordion items={ITEMS} defaultActiveKey="shipping" />,
};

export const Multiple: Story = {
  name: 'Multiple — several panels stay open at once (Collapse behavior)',
  render: () => <Accordion items={ITEMS} multiple defaultActiveKey={['shipping', 'warranty']} />,
};

export const Controlled: Story = {
  name: 'Controlled — activeKey + onChange from consumer state',
  render: () => {
    function Demo() {
      const [key, setKey] = useState<string | string[]>('returns');
      return (
        <div className="flex flex-col gap-3">
          <Accordion items={ITEMS} activeKey={key} onChange={setKey} />
          <div className="text-meta text-ink3">onChange payload: {JSON.stringify(key)}</div>
        </div>
      );
    }
    return <Demo />;
  },
};

export const DisabledItem: Story = {
  name: 'Disabled item — header locked, click does nothing',
  render: () => (
    <Accordion
      items={[
        ...ITEMS,
        {
          key: 'enterprise',
          label: 'Enterprise SLA (contact sales)',
          children: 'Hidden until unlocked.',
          disabled: true,
        },
      ]}
    />
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — bg-s2 panel + border-line follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <Accordion items={ITEMS} defaultActiveKey="returns" />
    </div>
  ),
};
