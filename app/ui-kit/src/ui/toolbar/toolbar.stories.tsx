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

/** CustomStyled — slots-wave classNames + style: `root` on the bar, `start` on
 * the left cluster, `end` on the right cluster; `style` lands on the bar. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  args: {
    classNames: { root: 'rounded-xl border border-dashed border-accent bg-accent/5 p-2', end: 'text-accent' },
    style: { padding: 8, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' },
    children: <span className="text-body text-ink">Toolbar content</span>,
    extra: <span className="text-meta">exported 42 rows</span>,
  },
};
