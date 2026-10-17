import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleButton } from './index';
const meta = { title: 'Forms/ToggleButton', component: ToggleButton, tags: ['autodocs'] } satisfies Meta<typeof ToggleButton>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = { args: { children: 'Toggle', checked: false, onChange: () => {} } };
export const Checked: S = { args: { children: 'Bật', checked: true } };
