// Fieldset stories — legend panel, toggleable collapse (grid-rows clip).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fieldset } from './index';

/** Legend panel — bordered frame with the legend riding the border. */
const meta = { title: 'Primitives/Fieldset', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Basic — legend + content, static frame. */
export const Basic: Story = {
  render: () => (
    <Fieldset legend="Shipping details" className="max-w-md">
      <p className="m-0">221B Baker Street, London — deliver before 6 PM.</p>
    </Fieldset>
  ),
};

/** Toggleable — click the legend to collapse / expand (grid-rows 0fr↔1fr animation). */
export const Toggleable: Story = {
  render: () => (
    <Fieldset legend="Advanced options" toggleable className="max-w-md">
      <p className="m-0">
        Retry policy: 3 attempts with exponential backoff, then the event parks in the DLQ for manual inspection.
      </p>
    </Fieldset>
  ),
};

/** DefaultCollapsed — starts folded; legend click unfolds. */
export const DefaultCollapsed: Story = {
  name: 'DefaultCollapsed — starts folded',
  render: () => (
    <Fieldset legend="Archived tasks" toggleable defaultCollapsed className="max-w-md">
      <p className="m-0">12 archived tasks — unfold to browse.</p>
    </Fieldset>
  ),
};

/** DarkTheme — border + legend backdrop follow tokens. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="p-2">
      <Fieldset legend="Session" toggleable className="max-w-md">
        <p className="m-0">Token refresh every 15 minutes via auth-svc.</p>
      </Fieldset>
    </div>
  ),
};

/* ── Customize pass (slots wave 3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / legend / content) +
 * style passthrough. `root` lands on the <fieldset> (same element as
 * `className`), `legend` on the floating header span, `content` on the padded
 * body div; `style` lands on the root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <Fieldset
      legend="Preferences"
      toggleable
      classNames={{
        root: 'border-st-done',
        legend: 'text-st-done uppercase tracking-wide',
        content: 'bg-accent/5',
      }}
      style={{ padding: 12, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
    >
      <p>Body content picks up the content slot.</p>
    </Fieldset>
  ),
};
