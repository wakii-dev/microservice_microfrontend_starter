// Parity matrix antd→tokens: docs/parity-matrix.md
// Collapse stories — accordion (one open) / multiple open panels / rich content / dark.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Collapse } from './index';

/** Progressive disclosure panels — several can stay open at once. */
const meta = { title: 'Data Display/Collapse', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { key: '1', label: 'Panel 1 — Overview', children: 'Panel 1 content. Click the header to expand/collapse (grid-rows animation).' },
  { key: '2', label: 'Panel 2 — Technical details', children: 'Panel 2 content. Multiple panels can be open at once (Set keys).' },
  { key: '3', label: 'Panel 3 — History', children: 'Panel 3 content. Chevron rotates 180° when open.' },
];

export const Accordion: Story = {
  name: 'Accordion — one panel open by default',
  render: () => <Collapse items={items} defaultActiveKeys={['1']} className="w-[480px]" />,
};

export const MultipleOpen: Story = {
  name: 'Multiple panels open at once',
  render: () => <Collapse items={items} defaultActiveKeys={['1', '3']} className="w-[480px]" />,
};

export const AllClosed: Story = {
  name: 'All closed — no defaultActiveKeys',
  render: () => <Collapse items={items} className="w-[480px]" />,
};

export const RichContent: Story = {
  name: 'Rich content — label + children as complex ReactNode',
  render: () => (
    <Collapse
      className="w-[480px]"
      defaultActiveKeys={['log']}
      items={[
        {
          key: 'log',
          label: (
            <span className="flex items-center gap-2">
              Deployment log <span className="text-meta text-ink3">(3 events)</span>
            </span>
          ),
          children: (
            <ul className="m-0 list-none space-y-2 p-0">
              <li className="flex justify-between"><span>Build #218 passed</span><span className="text-meta text-ink3">14:02</span></li>
              <li className="flex justify-between"><span>Deploy staging</span><span className="text-meta text-ink3">14:05</span></li>
              <li className="flex justify-between"><span>Smoke e2e 15/15</span><span className="text-meta text-ink3">14:11</span></li>
            </ul>
          ),
        },
        { key: 'env', label: 'Environment variables', children: <code className="font-mono text-meta">KAFKA_BROKERS=kafka:9092</code> },
      ]}
    />
  ),
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="w-[480px] rounded-xl bg-canvas p-4">
      <Collapse items={items} defaultActiveKeys={['1']} />
    </div>
  ),
};

// ── Case-coverage audit 2026-10-18 (antd parity: accordion + disabled) ──

export const AccordionMode: Story = {
  name: 'Accordion mode — opening a panel closes the others (accordion prop)',
  render: () => (
    <div className="w-[480px]">
      <Collapse accordion items={items} />
    </div>
  ),
};

export const DisabledItem: Story = {
  name: 'Disabled item — header locked, panel stays closed',
  render: () => (
    <div className="w-[480px]">
      <Collapse
        items={[
          ...items.slice(0, 1),
          { key: 'locked', label: 'Locked panel (no permission)', children: 'Hidden content', disabled: true },
          ...items.slice(1),
        ]}
      />
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` on the wrapper,
 * `item` on each panel, `header` on the toggle row, `panel` on the animated
 * grid, `content` on the padded body; `style` lands on the root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <Collapse
      style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
      classNames={{
        root: 'rounded-2xl border-dashed border-accent',
        header: 'uppercase tracking-wide',
        content: 'bg-accent/5',
      }}
      items={[
        { key: 'build', label: 'Build', children: 'Compile + test 10 services.' },
        { key: 'ship', label: 'Ship', children: 'Compose up, e2e green.' },
      ]}
    />
  ),
};
