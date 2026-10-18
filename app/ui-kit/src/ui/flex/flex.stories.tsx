// Parity matrix antd→tokens: docs/parity-matrix.md
// Flex stories — direction, gap scale, justify/align, wrap (antd v5 Flex parity).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Flex } from './index';

const meta = { title: 'Primitives/Flex', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Box({ label }: { label: string }) {
  return (
    <div className="grid h-10 place-items-center rounded-lg border border-line bg-s3 px-3 text-label text-ink2">
      {label}
    </div>
  );
}

export const Basic: Story = {
  name: 'Basic — horizontal with default gap',
  render: () => (
    <Flex>
      <Button type="primary">Primary</Button>
      <Button>Default</Button>
      <Button type="text">Text</Button>
      <Box label="box" />
    </Flex>
  ),
};

export const Vertical: Story = {
  name: 'Vertical — column layout',
  render: () => (
    <Flex vertical>
      <Box label="Item 1" />
      <Box label="Item 2" />
      <Box label="Item 3" />
    </Flex>
  ),
};

export const GapSizes: Story = {
  name: 'Gap — small 8 / middle 16 / large 24 / number',
  render: () => (
    <div className="flex flex-col gap-4">
      <Flex gap="small">
        <Box label="small 8" />
        <Box label="small 8" />
      </Flex>
      <Flex gap="middle">
        <Box label="middle 16" />
        <Box label="middle 16" />
      </Flex>
      <Flex gap="large">
        <Box label="large 24" />
        <Box label="large 24" />
      </Flex>
      <Flex gap={48}>
        <Box label="number 48" />
        <Box label="number 48" />
      </Flex>
    </div>
  ),
};

export const JustifyAlign: Story = {
  name: 'Justify & align — distribution + cross axis',
  render: () => (
    <div className="flex flex-col gap-4">
      {(['start', 'center', 'end', 'space-between', 'space-around'] as const).map((justify) => (
        <Flex key={justify} justify={justify} className="rounded-lg bg-s2 p-2">
          <Box label={justify} />
          <Box label={justify} />
        </Flex>
      ))}
      <Flex align="center" className="rounded-lg bg-s2 p-2">
        <Box label="align center" />
        <div className="grid h-16 place-items-center rounded-lg border border-line bg-accent/10 px-3 text-label text-ink2">tall</div>
      </Flex>
    </div>
  ),
};

export const Wrap: Story = {
  name: 'Wrap — items flow to the next line',
  render: () => (
    <Flex wrap className="w-96">
      {Array.from({ length: 8 }, (_, i) => (
        <Button key={i} size="small">
          Button {i + 1}
        </Button>
      ))}
    </Flex>
  ),
};
