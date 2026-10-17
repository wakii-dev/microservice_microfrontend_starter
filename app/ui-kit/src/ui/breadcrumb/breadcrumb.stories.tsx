// Parity matrix antd→tokens: docs/parity-matrix.md
// Breadcrumb stories — items + href, item cuối = plain text.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './index';
import { Icon } from '../icons/index';

const meta = { title: 'Navigation/Breadcrumb', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Basic — href + item cuối plain',
  render: () => (
    <Breadcrumb
      items={[
        { title: 'Trang chủ', href: '#' },
        { title: 'Công việc', href: '#' },
        { title: 'Chi tiết task #42' },
      ]}
    />
  ),
};

export const WithIcons: Story = {
  name: 'WithIcons — icon trong title',
  render: () => (
    <Breadcrumb
      items={[
        {
          title: (
            <span className="flex items-center gap-1">
              <Icon name="home" size={14} /> Trang chủ
            </span>
          ),
          href: '#',
        },
        {
          title: (
            <span className="flex items-center gap-1">
              <Icon name="check-circle" size={14} /> Dự án
            </span>
          ),
          href: '#',
        },
        {
          title: (
            <span className="flex items-center gap-1">
              <Icon name="calendar" size={14} /> Sprint 12
            </span>
          ),
        },
      ]}
    />
  ),
};
