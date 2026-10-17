import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chart } from './index';
const meta = { title: 'Data Display/Chart', component: Chart, tags: ['autodocs'] } satisfies Meta<typeof Chart>;
export default meta;
type S = StoryObj<typeof meta>;
export const Bar: S = { args: { config: { type: 'bar' as const, labels: ['T1', 'T2', 'T3'], datasets: [{ label: 'Doanh thu', data: [12, 19, 3] }] } } };
export const Fallback: S = { args: { config: { type: 'line' as const, labels: [], datasets: [] }, fallback: <p>Chart.js chưa cài</p> } };
