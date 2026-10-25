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
