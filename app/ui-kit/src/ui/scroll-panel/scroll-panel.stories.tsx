// Stories ScrollPanel — Primitives. Container scrollbar mảnh, height tuỳ ý.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollPanel } from './index';

/** Scrollable container with a slim custom scrollbar and fixed height. */
const meta = {
  title: 'Primitives/ScrollPanel',
  component: ScrollPanel,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

const LINES = Array.from({ length: 40 }, (_, i) => `Dòng ${i + 1} — nội dung demo cuộn`);

export const CoBan: Story = {
  name: 'Basic — 200px height, slim scrollbar',
  render: () => (
    <ScrollPanel className="w-80">
      <div className="flex flex-col gap-1 text-body text-ink2">
        {LINES.map((line) => <p key={line}>{line}</p>)}
      </div>
    </ScrollPanel>
  ),
};

export const Cao: Story = {
  name: 'Custom height — 350px',
  render: () => (
    <ScrollPanel height="350px" className="w-96">
      <div className="flex flex-col gap-1 text-body text-ink2">
        {LINES.map((line) => <p key={line}>{line}</p>)}
      </div>
    </ScrollPanel>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the scroll
 * container; `style` merges after the height inline style. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <ScrollPanel
      height="160px"
      classNames={{ root: 'border-dashed border-accent bg-accent/5' }}
      style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
    >
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i} className="text-body text-ink2">Scrollable line {i + 1}</li>
        ))}
      </ul>
    </ScrollPanel>
  ),
};
