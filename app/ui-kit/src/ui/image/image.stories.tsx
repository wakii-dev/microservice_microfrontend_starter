// Image stories — preview click.
import { Image as AntdImage } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { UiImage } from './index';

const meta = { title: 'Data Display/Image', component: UiImage, tags: ['autodocs'] } satisfies Meta<typeof UiImage>;
export default meta;
type Story = StoryObj<typeof meta>;

const SRC = 'https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg';

export const ParityVsAntd: Story = {
  args: { src: 'x', alt: 'demo' },
  render: () => (
    <Parity antd={<AntdImage width={160} src={SRC} alt="antd" />} ours={<UiImage src={SRC} alt="ui-kit" width={160} />} />
  ),
};
