import type { Meta, StoryObj } from '@storybook/react-vite';
import { Galleria } from './index';
const meta = { title: 'Data Display/Galleria', component: Galleria, tags: ['autodocs'] } satisfies Meta<typeof Galleria>;
export default meta;
type S = StoryObj<typeof meta>;
const IMGS = [
  { src: 'https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg', alt: 'A' },
  { src: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg', alt: 'B' },
];
export const MacDinh: S = { args: { images: IMGS } };
