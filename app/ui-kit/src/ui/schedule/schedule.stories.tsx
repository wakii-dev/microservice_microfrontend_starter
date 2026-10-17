import type { Meta, StoryObj } from '@storybook/react-vite';
import { Schedule } from './index';
const meta = { title: 'Data Display/Schedule', component: Schedule, tags: ['autodocs'] } satisfies Meta<typeof Schedule>;
export default meta;
type S = StoryObj<typeof meta>;
export const Fallback: S = { args: { fallback: <p>Cài @fullcalendar/* để dùng Schedule</p> } };
