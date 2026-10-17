import type { Meta, StoryObj } from '@storybook/react-vite';
import { Editor } from './index';
const meta = { title: 'Forms/Editor', component: Editor, tags: ['autodocs'] } satisfies Meta<typeof Editor>;
export default meta;
type S = StoryObj<typeof meta>;
export const Fallback: S = { args: { fallback: <p>Cài @tiptap/react để dùng</p> } };
