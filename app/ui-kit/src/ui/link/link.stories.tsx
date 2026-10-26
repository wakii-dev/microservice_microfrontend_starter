// Link stories — antd Typography.Link / MUI Link parity (docs/parity-matrix.md Gap P0).
// Matrix: basic · underline modes · disabled · in-text usage · external.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './index';

const meta = {
  title: 'Primitives/Link',
  component: Link,
  tags: ['autodocs'],
  argTypes: {
    underline: { control: 'select', options: ['none', 'hover', 'always'] },
    disabled: { control: 'boolean' },
    href: { control: 'text' },
  },
} satisfies Meta<typeof Link>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Basic — accent color, accent-hi on hover, underline on hover (default). */
export const Basic: Story = {
  args: { children: 'View tasks', href: '#tasks' },
};

/** Underline — none / hover (default) / always. */
export const Underline: Story = {
  args: { children: 'Underline modes' },
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <Link href="#a" underline="none">underline="none"</Link>
      <Link href="#b" underline="hover">underline="hover"</Link>
      <Link href="#c" underline="always">underline="always"</Link>
    </div>
  ),
};

/** Disabled — no href, aria-disabled, clicks are swallowed. */
export const Disabled: Story = {
  args: { children: 'Disabled link' },
  render: () => (
    <div className="flex items-center gap-6">
      <Link href="#d" disabled>Disabled link</Link>
      <Link href="#e">Enabled link</Link>
    </div>
  ),
};

/** In context — inline inside a Typography paragraph. */
export const InContext: Story = {
  args: { children: 'Link in context' },
  render: () => (
    <p className="max-w-md text-body text-ink2">
      Read the <Link href="#docs">documentation</Link> first, then check the{' '}
      <Link href="#faq" underline="always">FAQ</Link> — or open a ticket if the{' '}
      <Link href="#support" disabled>support channel</Link> is unavailable.
    </p>
  ),
};

/** External — passthrough anchor props (target/rel) work as expected. */
export const External: Story = {
  args: { children: 'Open Storybook ↗' },
  render: () => (
    <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
      Open Storybook ↗
    </Link>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the <a>;
 * inline `style` passes through anchor attributes. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  args: {
    href: '#custom-styled',
    children: 'Slotted link',
    classNames: { root: 'font-semibold uppercase tracking-wide' },
    style: { padding: 4, border: '1px dashed currentColor' },
  },
};
