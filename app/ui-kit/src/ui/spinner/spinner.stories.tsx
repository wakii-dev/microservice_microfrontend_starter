// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './index';

/** Inline busy indicator — ring/dots/bars, label is the accessible name. */
const meta = {
  title: 'Feedback/Spinner',
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

/** CustomStyled — classNames slots (root/indicator) + style passthrough (slots wave 3).
 * root lands on the role="status" span; indicator targets the variant node
 * (the spinning ring / dots row / bars row) inside it. */
export const CustomStyled = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner label="styled ring spinner" classNames={{ root: 'scale-125' }} style={{ padding: 8 }} />
      <Spinner
        label="styled dots spinner"
        variant="dots"
        classNames={{ root: 'rounded-md bg-accent/10 p-2', indicator: 'gap-[0.5em]' }}
      />
      <Spinner
        label="styled bars spinner"
        variant="bars"
        classNames={{ indicator: 'opacity-70' }}
      />
    </div>
  ),
};
