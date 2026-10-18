// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './index';

const meta = {
  title: 'Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;
export default meta;

type Story = StoryObj<typeof meta>;
type R = StoryObj;

// label is the REQUIRED aria-label (role="status" — screen readers need to know what is busy)
export const Default: Story = { name: 'Default — ring, accent', args: { label: 'Updating task' } };

export const Variants: R = {
  name: 'Variants — ring / dots / bars',
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner label="ring spinner" variant="ring" />
      <Spinner label="dots spinner" variant="dots" />
      <Spinner label="bars spinner" variant="bars" />
    </div>
  ),
};

export const Sizes: R = {
  name: 'Sizes — small / default / large',
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner label="small spinner" size="small" />
      <Spinner label="default spinner" size="default" />
      <Spinner label="large spinner" size="large" />
    </div>
  ),
};

export const Colors: R = {
  name: 'Colors — accent / muted / inverse',
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner label="accent spinner" color="accent" />
      <Spinner label="muted spinner" color="muted" />
      <div className="rounded-lg bg-ink p-3">
        <Spinner label="inverse spinner" color="inverse" />
      </div>
    </div>
  ),
};

export const DarkTheme: R = {
  name: 'DarkTheme — accent/muted dark values',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <div className="flex items-center gap-6">
        <Spinner label="dark accent spinner" />
        <Spinner label="dark muted spinner" color="muted" />
      </div>
    </div>
  ),
};
