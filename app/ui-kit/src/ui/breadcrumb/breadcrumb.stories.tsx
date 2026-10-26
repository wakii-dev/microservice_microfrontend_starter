// Breadcrumb stories — items + href, last item renders as plain text.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './index';
import { Icon } from '../icons/index';
import { Segmented } from '../segmented/index';

/** Hierarchy trail of links to the current page. */
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

// ── Real-world usage (2026-10-25): list-page header with view switcher ──

/** PageHeader — the classic list-page header: breadcrumb trail
 * ("Bảng điều khiển / Dự án / <name>"), title + meta, and a Segmented view switcher
 * (Table / List / Calendar). Swap the placeholder panel for the real view. */
export const PageHeader: Story = {
  name: 'Page header — breadcrumb + title + Segmented view switcher',
  render: () => <PageHeaderDemo />,
};

function PageHeaderDemo() {
  const [view, setView] = useState('table');
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <Breadcrumb
        items={[
          { title: 'Bảng điều khiển', href: '#' },
          { title: 'Dự án', href: '#' },
          { title: 'Aurora redesign' },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-h2 font-semibold text-ink">{'Aurora redesign'}</h1>
          <span className="text-meta text-ink3">{'24 tasks · 6 members · due Nov 14'}</span>
        </div>
        <Segmented
          ariaLabel="Chế độ xem"
          value={view}
          onChange={setView}
          options={[
            { label: 'Bảng', value: 'table' },
            { label: 'Danh sách', value: 'list' },
            { label: 'Lịch', value: 'calendar' },
          ]}
        />
      </div>
      <div className="rounded-lg border border-line bg-s2 p-6 text-center text-meta text-ink3">
        {'View: '}
        <span className="font-medium text-ink">{view}</span>
        {' — swap in the real table / list / calendar here.'}
      </div>
    </div>
  );
}

/** CustomStyled — slots-wave classNames + style: `root` on the nav, `list` on
 * the <ol>, `item` on each <li>, `link`/`label` on entries, `separator` on the
 * '/' spans; `style` lands on the nav. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <Breadcrumb
      items={[{ title: 'Home', href: '#' }, { title: 'Projects', href: '#' }, { title: 'Gateway' }]}
      classNames={{
        root: 'rounded-lg border border-dashed border-accent bg-accent/5 px-2 py-1',
        link: 'underline',
        label: 'uppercase tracking-wide',
        separator: 'text-accent',
      }}
      style={{ padding: 8 }}
    />
  ),
};
