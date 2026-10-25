import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Icon } from '../icons/index';
import { Toolbar } from './index';
/** Toolbar row — left tools, right actions (extra slot). */
const meta = { title: 'Navigation/Toolbar', component: Toolbar, tags: ['autodocs'] } satisfies Meta<typeof Toolbar>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = {
  name: 'Default',
  args: { children: <span>Công cụ</span>, extra: <span>Extra</span> },
};

export const WithExtra: S = {
  name: 'With extra — left tools + right actions (filter bar)',
  args: {
    children: (
      <>
        <span className="flex items-center gap-1.5 text-body text-ink2">
          <Icon name="filter" size={14} />
          Filter tools
        </span>
        <Button size="small">Clear</Button>
      </>
    ),
    extra: (
      <>
        <Button size="small">Reset</Button>
        <Button size="small" type="primary">
          Apply
        </Button>
      </>
    ),
  },
};
