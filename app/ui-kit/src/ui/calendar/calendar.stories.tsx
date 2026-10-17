import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from './index';
const meta = { title: 'Forms/Calendar', component: Calendar, tags: ['autodocs'] } satisfies Meta<typeof Calendar>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = {};

export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <Calendar />
    </div>
  ),
};
