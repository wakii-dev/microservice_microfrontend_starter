// Breadcrumb stories.
import { Breadcrumb as AntdBreadcrumb } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Breadcrumb } from './index';

const meta = { title: 'Navigation/Breadcrumb', component: Breadcrumb, tags: ['autodocs'] } satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  args: { items: [] },
  render: () => (
    <Parity
      antd={
        <AntdBreadcrumb
          items={[
            { title: 'Trang chủ', href: '/' },
            { title: 'Tasks', href: '/tasks' },
            { title: 'Task A' },
          ]}
        />
      }
      ours={
        <Breadcrumb
          items={[
            { title: 'Trang chủ', href: '/' },
            { title: 'Tasks', href: '/tasks' },
            { title: 'Task A' },
          ]}
        />
      }
    />
  ),
};
