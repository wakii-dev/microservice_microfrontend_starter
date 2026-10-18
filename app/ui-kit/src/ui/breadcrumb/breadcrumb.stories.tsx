// Breadcrumb stories — items + href, last item renders as plain text.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './index';
import { Icon } from '../icons/index';

const meta = { title: 'Navigation/Breadcrumb', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Basic — hrefs + last item plain',
  render: () => (
    <Breadcrumb
      items={[
        { title: 'Home', href: '#' },
        { title: 'Projects', href: '#' },
        { title: 'Task #42 detail' },
      ]}
    />
  ),
};

export const WithIcons: Story = {
  name: 'WithIcons — icons inside titles',
  render: () => (
    <Breadcrumb
      items={[
        {
          title: (
            <span className="flex items-center gap-1">
              <Icon name="home" size={14} /> Home
            </span>
          ),
          href: '#',
        },
        {
          title: (
            <span className="flex items-center gap-1">
              <Icon name="check-circle" size={14} /> Workspace
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
