import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tree } from './index';
const meta = { title: 'Data Display/Tree', component: Tree, tags: ['autodocs'] } satisfies Meta<typeof Tree>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = {
  args: { data: [
    { key: '1', label: 'Folder', children: [{ key: '1-1', label: 'File.ts' }] },
    { key: '2', label: 'README.md' },
  ], defaultExpandedKeys: ['1'] },
};
