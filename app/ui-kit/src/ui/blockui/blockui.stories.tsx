import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlockUI } from './index';

const meta = { title: 'Feedback/BlockUI', component: BlockUI, tags: ['autodocs'] } satisfies Meta<typeof BlockUI>;
export default meta;
type S = StoryObj<typeof meta>;
type R = StoryObj;

export const Blocked: S = {
  name: 'Blocked — mask overlay + message',
  args: { blocked: true, message: 'Processing…', children: <div className="p-8">Blocked content</div> },
};

export const Unblocked: S = {
  name: 'Unblocked — no overlay',
  args: { blocked: false, children: <div className="p-8">Normal content</div> },
};

export const NoMessage: S = {
  name: 'No message — scrim only',
  args: { blocked: true, children: <div className="p-8">Covered content, no center label</div> },
};

export const DarkTheme: R = {
  name: 'DarkTheme — mask scrim rgba(0,0,0,.6) dark',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <BlockUI blocked message="Processing… (dark)">
        <div className="p-8">Blocked content inside dark scope</div>
      </BlockUI>
    </div>
  ),
};
