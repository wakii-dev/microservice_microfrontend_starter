import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './index';
const meta = { title: 'Forms/Slider', component: Slider, tags: ['autodocs'] } satisfies Meta<typeof Slider>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = { args: { value: 50, min: 0, max: 100 } };
export const Range: S = { args: { range: [20, 80], min: 0, max: 100 } };
