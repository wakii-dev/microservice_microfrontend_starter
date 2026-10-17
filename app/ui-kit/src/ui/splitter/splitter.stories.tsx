import type { Meta, StoryObj } from '@storybook/react-vite';
import { Splitter } from './index';
const meta = { title: 'Navigation/Splitter', component: Splitter, tags: ['autodocs'] } satisfies Meta<typeof Splitter>;
export default meta;
type S = StoryObj<typeof meta>;
export const Horizontal: S = {
  args: { first: <div className="grid h-40 place-items-center bg-s3">Trái</div>, second: <div className="grid h-40 place-items-center bg-s3">Phải</div> },
};
