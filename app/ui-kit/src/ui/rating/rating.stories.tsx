import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rating } from './index';
const meta = { title: 'Data Display/Rating', component: Rating, tags: ['autodocs'] } satisfies Meta<typeof Rating>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = {};
export const ReadOnly: S = { args: { value: 3, readOnly: true } };
