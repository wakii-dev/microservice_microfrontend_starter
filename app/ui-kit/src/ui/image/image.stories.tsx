// Parity matrix antd→tokens: docs/parity-matrix.md
// Image stories — preview click.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UiImage } from './index';

const meta = { title: 'Data Display/Image', component: UiImage, tags: ['autodocs'] } satisfies Meta<typeof UiImage>;
export default meta;
type Story = StoryObj<typeof meta>;

const SRC = 'https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg';

