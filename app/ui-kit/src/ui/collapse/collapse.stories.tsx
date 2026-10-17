// Collapse stories — default open + toggle.
import { Collapse as AntdCollapse } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Collapse } from './index';

const meta = { title: 'Data Display/Collapse', component: Collapse, tags: ['autodocs'] } satisfies Meta<typeof Collapse>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  args: { items: [] },
  render: () => (
    <Parity
      antd={
        <AntdCollapse
          items={[
            { key: '1', label: 'Panel A', children: <p>nội dung A</p> },
            { key: '2', label: 'Panel B', children: <p>nội dung B</p> },
          ]}
          defaultActiveKey={['1']}
        />
      }
      ours={
        <Collapse
          items={[
            { key: '1', label: 'Panel A', children: <p>nội dung A</p> },
            { key: '2', label: 'Panel B', children: <p>nội dung B</p> },
          ]}
          defaultActiveKeys={['1']}
        />
      }
    />
  ),
};
