import type { Meta, StoryObj } from '@storybook/react-vite';
import { Splitter } from './index';
/** Two-pane drag resizer — horizontal/vertical, percent size. */
const meta = { title: 'Navigation/Splitter', component: Splitter, tags: ['autodocs'] } satisfies Meta<typeof Splitter>;
export default meta;
type S = StoryObj<typeof meta>;
export const Horizontal: S = {
  args: { first: <div className="grid h-40 place-items-center bg-s3">Trái</div>, second: <div className="grid h-40 place-items-center bg-s3">Phải</div> },
};

export const Vertical: S = {
  name: 'Vertical — direction + defaultSize 30% (drag to resize)',
  args: {
    direction: 'vertical',
    defaultSize: 30,
    first: <div className="grid h-full place-items-center bg-s3">Trên (30%)</div>,
    second: <div className="grid h-full place-items-center bg-s3">Dưới</div>,
  },
  render: ({ first, second, direction, defaultSize }) => (
    <div className="h-64 w-full">
      <Splitter direction={direction} defaultSize={defaultSize} first={first} second={second} />
    </div>
  ),
};
