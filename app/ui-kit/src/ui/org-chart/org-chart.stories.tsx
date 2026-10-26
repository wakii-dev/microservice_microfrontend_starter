// OrgChart stories — company chart 3 cấp / collapse sẵn / selection / dark theme.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { OrgChart, type OrgChartNodeData } from './index';

/** Hierarchical org chart — nodes, connectors, collapse branches. */
const meta = { title: 'Data Display/OrgChart', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

const COMPANY: OrgChartNodeData = {
  key: 'ceo',
  label: 'Alice Nguyễn — CEO',
  type: 'dept',
  children: [
    {
      key: 'eng',
      label: 'Engineering',
      type: 'dept',
      children: [
        { key: 'fe', label: 'Hải — FE lead' },
        { key: 'be', label: 'Hội — BE lead' },
        { key: 'qa', label: 'Lan — QA' },
      ],
    },
    { key: 'hr', label: 'People / HR', type: 'dept' },
    {
      key: 'ops',
      label: 'Operations',
      type: 'dept',
      children: [{ key: 'devops', label: 'Khoa — DevOps' }],
    },
  ],
};

export const CompanyChart: S = {
  name: 'Company chart — 3 levels, dept vs person nodes',
  render: () => (
    <div className="w-full p-6">
      <OrgChart data={COMPANY} />
    </div>
  ),
};

export const CollapsedByDefault: S = {
  name: 'Collapsed by default — only root + first level',
  render: () => (
    <div className="w-full p-6">
      <OrgChart data={COMPANY} defaultCollapsedKeys={['ceo']} />
    </div>
  ),
};

function SelectableDemo() {
  const [selected, setSelected] = useState<string | undefined>('eng');
  return (
    <div className="w-full p-6">
      <OrgChart data={COMPANY} selectedKey={selected} onSelect={setSelected} />
      <p className="mt-4 text-meta text-ink3">selected: {selected ?? '—'}</p>
    </div>
  );
}

export const Selectable: S = {
  name: 'Selection — click node to select (accent ring + aria-selected)',
  render: () => <SelectableDemo />,
};

export const DarkTheme: S = {
  name: 'Dark theme — connectors + cards follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="w-full rounded-xl bg-canvas p-6">
      <OrgChart data={COMPANY} />
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` on the scroll wrapper,
 * `tree` on every level <ul>, `item` on treeitems, `node` on cards, `toggle`
 * on chevron buttons; `style` lands on the root. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <OrgChart
      style={{ padding: 8 }}
      classNames={{
        root: 'rounded-xl border border-dashed border-accent bg-accent/5',
        node: 'uppercase tracking-wide',
        toggle: 'text-accent',
      }}
      data={{
        key: 'root',
        label: 'Platform',
        type: 'dept',
        children: [
          { key: 'be', label: 'Backend', type: 'dept' },
          { key: 'fe', label: 'Frontend', type: 'dept' },
        ],
      }}
    />
  ),
};
