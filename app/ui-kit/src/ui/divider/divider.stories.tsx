// Parity matrix antd→tokens: docs/parity-matrix.md
// Divider stories — horizontal, with text, dashed + vertical.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './index';

/** Horizontal/vertical rule — optional text label embedded in the line. */
const meta = { title: 'Primitives/Divider', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  name: 'Horizontal — plain + vertical inline',
  render: () => (
    <div>
      <span>Content above</span>
      <Divider />
      <span>Content below</span>
      <div className="mt-2">
        <span>Left</span>
        <Divider type="vertical" />
        <span>Middle</span>
        <Divider type="vertical" />
        <span>Right</span>
      </div>
    </div>
  ),
};

export const WithText: Story = {
  name: 'WithText — text between the lines',
  render: () => (
    <div>
      <span>Section A</span>
      <Divider>Section B</Divider>
      <span>Section B content</span>
    </div>
  ),
};

export const Dashed: Story = {
  name: 'Dashed — horizontal + with text',
  render: () => (
    <div>
      <span>Content 1</span>
      <Divider dashed />
      <span>Content 2</span>
      <Divider dashed>Dashed rule</Divider>
      <span>Content 3</span>
    </div>
  ),
};

// ── Case-coverage audit 2026-10-18 (antd parity: orientation) ──

export const Orientation: Story = {
  name: 'Orientation — text left / center / right',
  render: () => (
    <div className="max-w-md">
      <Divider orientation="left">Left aligned</Divider>
      <span>Content</span>
      <Divider>Center (default)</Divider>
      <span>Content</span>
      <Divider orientation="right">Right aligned</Divider>
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` on the separator,
 * `label` on the text span, `line` on the rule spans; `style` lands on the root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="flex flex-col gap-4">
      <Divider classNames={{ label: 'uppercase tracking-wide text-accent', line: 'border-dashed' }}>Sections</Divider>
      <Divider dashed orientation="left" classNames={{ root: 'text-accent' }} style={{ margin: '8px 0' }}>
        Slotted margin
      </Divider>
    </div>
  ),
};
