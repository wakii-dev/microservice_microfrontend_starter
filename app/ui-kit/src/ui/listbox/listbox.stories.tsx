import type { Meta, StoryObj } from '@storybook/react-vite';
import { Listbox } from './index';
const meta = { title: 'Data Display/Listbox', component: Listbox, tags: ['autodocs'] } satisfies Meta<typeof Listbox>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = {
  args: { options: [{ label: 'Alice', value: 'a' }, { label: 'Bob', value: 'b' }], value: 'a' },
};
