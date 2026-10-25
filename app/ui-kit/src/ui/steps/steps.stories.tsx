// Parity matrix antd→tokens: docs/parity-matrix.md
// Steps stories — Basic / Completed / WithDescription / ManySteps / DarkTheme.
// Horizontal only — component has no size/vertical prop (don't invent).
// `current` is fully prop-driven — no internal state, so no controlled story.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Steps } from './index';

/** Horizontal wizard progress header — done/current/waiting. */
const meta = { title: 'Navigation/Steps', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { title: 'Choose type', description: 'Task kind' },
  { title: 'Fill form', description: 'Title + assignee' },
  { title: 'Confirm', description: 'Review & create' },
];

export const Basic: Story = {
  name: 'Basic — current in the middle',
  render: () => <Steps items={items} current={1} className="max-w-[560px]" />,
};

export const Completed: Story = {
  name: 'Completed — current at the end',
  render: () => <Steps items={items} current={3} className="max-w-[560px]" />,
};

export const WithDescription: Story = {
  name: 'With description + not started',
  render: () => (
    <div className="flex flex-col gap-6">
      <Steps items={items} current={2} className="max-w-[560px]" />
      <Steps items={items} current={0} className="max-w-[560px]" />
    </div>
  ),
};

export const ManySteps: Story = {
  name: 'Many steps — 5 items, no description',
  render: () => (
    <Steps
      items={[{ title: 'Draft' }, { title: 'Review' }, { title: 'Approve' }, { title: 'Publish' }, { title: 'Done' }]}
      current={2}
      className="max-w-[720px]"
    />
  ),
};

export const DarkTheme: Story = {
  name: 'Dark theme — accent/border follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="max-w-[560px] rounded-xl bg-s2 p-4">
      <Steps items={items} current={1} />
    </div>
  ),
};

/** CustomStyled — classNames slots (root/step/indicator/label/description) + style passthrough (slots wave 3). */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="max-w-[560px]">
      <Steps
        items={[
          { title: 'Contract', description: 'OpenAPI synced' },
          { title: 'Implement', description: 'Services + FE' },
          { title: 'Verify', description: 'e2e green' },
        ]}
        current={1}
        style={{ padding: 12 }}
        classNames={{
          root: 'rounded-xl border border-line bg-s2',
          step: 'gap-3',
          indicator: 'shadow-[var(--ele-1)]',
          label: 'tracking-wide',
        }}
      />
    </div>
  ),
};
