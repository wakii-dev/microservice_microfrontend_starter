// ButtonGroup stories — joined chrome (seam + shared corners), size/type cascade.
// Meta intentionally has NO `component:` — ariaLabel is required, so component-meta
// + args-typed stories would hit TS2322 (progress.stories pattern, not button.stories).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../icons/index';
import { Button } from './index';
import { ButtonGroup } from './group';

const meta = { title: 'Primitives/ButtonGroup', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Basic — 3 attached default buttons; 1px seam, outer corners keep rounded-lg. */
export const Basic: Story = {
  render: () => (
    <ButtonGroup ariaLabel="Basic actions">
      <Button>Left</Button>
      <Button>Center</Button>
      <Button>Right</Button>
    </ButtonGroup>
  ),
};

/** Sizes — group size cascades to every child button (h-8 / h-9 / h-10). */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {(['small', 'middle', 'large'] as const).map((s) => (
        <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 48, fontSize: 12, opacity: 0.6 }}>{s}</span>
          <ButtonGroup ariaLabel={`${s} size group`} size={s}>
            <Button>Day</Button>
            <Button>Week</Button>
            <Button>Month</Button>
          </ButtonGroup>
        </div>
      ))}
    </div>
  ),
};

/** Vertical — column orientation, seam runs horizontally (-mt-px). */
export const Vertical: Story = {
  render: () => (
    <ButtonGroup ariaLabel="Vertical actions" orientation="vertical">
      <Button>Up</Button>
      <Button>Middle</Button>
      <Button>Down</Button>
    </ButtonGroup>
  ),
};

/** PrimaryGroup — primary cascade; one child opts out with danger (kept explicit). */
export const PrimaryGroup: Story = {
  render: () => (
    <ButtonGroup ariaLabel="Primary group" type="primary">
      <Button>Save</Button>
      <Button>Publish</Button>
      <Button danger>Delete</Button>
    </ButtonGroup>
  ),
};

/** WithIcons — icon + label inside attached buttons. */
export const WithIcons: Story = {
  render: () => (
    <ButtonGroup ariaLabel="Editor actions">
      <Button icon={<Icon name="check" size={14} />}>Approve</Button>
      <Button icon={<Icon name="times" size={14} />}>Reject</Button>
    </ButtonGroup>
  ),
};
