import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './index';
const meta = { title: 'Data Display/Avatar', component: Avatar, tags: ['autodocs'] } satisfies Meta<typeof Avatar>;
export default meta;
type S = StoryObj<typeof meta>;
export const CoBan: S = { args: { children: 'A' } };
export const Anh: S = { args: { src: 'https://i.pravatar.cc/150?img=1', alt: 'user' } };
export const Square48: S = { args: { children: 'B', size: 48, shape: 'square' } };
