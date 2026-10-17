import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from './index';
const meta = { title: 'Data Display/Carousel', component: Carousel, tags: ['autodocs'] } satisfies Meta<typeof Carousel>;
export default meta;
type S = StoryObj<typeof meta>;
export const CoBan: S = {
  args: { items: [<span key='1'>1</span>] },
  render: () => <Carousel items={[<div key="1" className="grid h-48 place-items-center bg-s3">Slide 1</div>, <div key="2" className="grid h-48 place-items-center bg-s3">Slide 2</div>]} /> };
export const Autoplay: S = {
  args: { items: [<span key='1'>1</span>] },
  render: () => <Carousel autoplay items={[<div key="1" className="grid h-48 place-items-center bg-s3">Auto 1</div>, <div key="2" className="grid h-48 place-items-center bg-s3">Auto 2</div>]} /> };
