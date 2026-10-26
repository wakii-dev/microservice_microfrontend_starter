// TreeTable stories — org tree, custom render, controlled selection, empty.
// Parity matrix PrimeReact→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from '../tag/index.js';
import { TreeTable, type TreeTableNode } from './index';

/** Tree data in a table grid — rows expandable by hierarchy. */
const meta = {
  title: 'Data Display/TreeTable',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

const FS: TreeTableNode[] = [
  {
    key: 'src',
    values: { name: 'src', kind: 'dir', size: '—' },
    children: [
      {
        key: 'ui',
        values: { name: 'ui', kind: 'dir', size: '—' },
        children: [
          { key: 'button', values: { name: 'button.tsx', kind: 'tsx', size: '8 KB' } },
          { key: 'table', values: { name: 'table.tsx', kind: 'tsx', size: '31 KB' } },
        ],
      },
      { key: 'hooks', values: { name: 'hooks.ts', kind: 'ts', size: '4 KB' } },
    ],
  },
  { key: 'readme', values: { name: 'README.md', kind: 'md', size: '2 KB' } },
];

const COLS = [
  { key: 'name', header: 'Name' },
  { key: 'size', header: 'Size', align: 'right' as const },
];

export const Basic: Story = {
  name: 'Basic — file tree, expand via chevron (single column level indent)',
  render: () => <TreeTable data={FS} columns={COLS} defaultExpandedKeys={['src']} />,
};

export const CustomRender: Story = {
  name: 'Custom render — kind column as Tag, right-aligned size',
  render: () => (
    <TreeTable
      data={FS}
      columns={[
        { key: 'name', header: 'Name' },
        {
          key: 'kind',
          header: 'Kind',
          render: (n) => (n.values.kind === 'dir' ? <Tag>dir</Tag> : <span className="text-meta text-ink3">{String(n.values.kind)}</span>),
        },
        { key: 'size', header: 'Size', align: 'right' },
      ]}
      defaultExpandedKeys={['src', 'ui']}
    />
  ),
};

export const RowSelection: Story = {
  name: 'Row selection — checkbox column + select-all (includes collapsed nodes)',
  render: () => {
    function Demo() {
      const [sel, setSel] = useState<string[]>([]);
      return (
        <div className="flex flex-col gap-3">
          <TreeTable
            data={FS}
            columns={COLS}
            selectionMode="checkbox"
            selectedKeys={sel}
            onSelectionChange={setSel}
            defaultExpandedKeys={['src']}
          />
          <div className="text-meta text-ink3">selected: {JSON.stringify(sel)}</div>
        </div>
      );
    }
    return <Demo />;
  },
};

export const SingleSelection: Story = {
  name: 'Single selection — click a row to highlight (accent tint)',
  render: () => {
    function Demo() {
      const [sel, setSel] = useState<string[]>(['readme']);
      return <TreeTable data={FS} columns={COLS} selectionMode="single" selectedKeys={sel} onSelectionChange={setSel} />;
    }
    return <Demo />;
  },
};

export const Empty: Story = {
  name: 'Empty — no data falls back to EmptyState',
  render: () => <TreeTable data={[]} columns={COLS} />,
};

export const DarkTheme: Story = {
  name: 'DarkTheme — surface/border/selection follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <TreeTable data={FS} columns={COLS} defaultExpandedKeys={['src', 'ui']} selectionMode="single" />
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` on the treegrid,
 * `headerRow` on the top strip, `row`/`cell` on body rows and cells,
 * `expander` on the chevron button, `panel` on the animated subtree wrapper;
 * `style` lands on the root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <TreeTable
      style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
      classNames={{
        root: 'border-dashed border-accent',
        headerRow: 'bg-accent/10 uppercase tracking-wide',
        row: 'border-b-2',
        expander: 'text-accent',
      }}
      defaultExpandedKeys={['services']}
      columns={[
        { key: 'name', header: 'Service' },
        { key: 'size', header: 'Bundle', align: 'right' },
      ]}
      data={[
        {
          key: 'services',
          values: { name: 'services', size: '—' },
          children: [
            { key: 'node', values: { name: 'node-svc', size: '2.1MB' } },
            { key: 'gateway', values: { name: 'gateway', size: '0.4MB' } },
          ],
        },
        { key: 'contracts', values: { name: 'contracts', size: '0.2MB' } },
      ]}
    />
  ),
};
