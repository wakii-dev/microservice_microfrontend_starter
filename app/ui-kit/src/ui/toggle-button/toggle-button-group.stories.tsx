// ToggleButtonGroup stories — single/multiple toggle clusters (antd-lite
// "checked semantics", PrimeReact SelectButton use-case). Meta without
// `component` — children is a required prop, CSF types would then force args
// onto render-only stories (image.stories pattern).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleButton } from './index.js';
import { ToggleButtonGroup } from './toggle-button-group.js';

const meta = { title: 'Forms/ToggleButtonGroup', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Basic — single-pick view switcher; the group owns which value is pressed. */
export const Basic: Story = {
  name: 'Basic — single pick (view switcher)',
  render: () => <SingleDemo />,
};

/** Multiple — chip-style multi pick; clicking a pressed chip removes it. */
export const Multiple: Story = {
  name: 'Multiple — multi pick filters',
  render: () => <MultipleDemo />,
};

/** Disabled — whole group locked (individual buttons can still self-disable). */
export const Disabled: Story = {
  name: 'Disabled — locked group',
  render: () => (
    <ToggleButtonGroup disabled value="day" ariaLabel="Density" className="opacity-90">
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month" disabled>Month</ToggleButton>
    </ToggleButtonGroup>
  ),
};

/** DarkTheme — both modes on the dark canvas. */
export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="flex w-fit flex-col gap-3 rounded-xl bg-canvas p-4">
      <ToggleButtonGroup value="grid" ariaLabel="View">
        <ToggleButton value="grid">Grid</ToggleButton>
        <ToggleButton value="table">Table</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup multiple value={['new']} ariaLabel="Tags">
        <ToggleButton value="new">New</ToggleButton>
        <ToggleButton value="done">Done</ToggleButton>
      </ToggleButtonGroup>
    </div>
  ),
};

function SingleDemo() {
  const [view, setView] = useState('board');
  return (
    <div className="flex flex-col gap-3">
      <ToggleButtonGroup value={view} onChange={setView} ariaLabel="View mode">
        <ToggleButton value="list">List</ToggleButton>
        <ToggleButton value="board">Board</ToggleButton>
        <ToggleButton value="timeline">Timeline</ToggleButton>
      </ToggleButtonGroup>
      <p className="m-0 font-mono text-meta text-ink3">
        value: <strong className="text-ink">{view}</strong>
      </p>
    </div>
  );
}

function MultipleDemo() {
  const [filters, setFilters] = useState<string[]>(['bugs']);
  return (
    <div className="flex flex-col gap-3">
      <ToggleButtonGroup multiple value={filters} onChange={setFilters} ariaLabel="Item types">
        <ToggleButton value="bugs">Bugs</ToggleButton>
        <ToggleButton value="features">Features</ToggleButton>
        <ToggleButton value="docs">Docs</ToggleButton>
      </ToggleButtonGroup>
      <p className="m-0 font-mono text-meta text-ink3">
        value: <strong className="text-ink">[{filters.join(', ')}]</strong>
      </p>
    </div>
  );
}

/** CustomStyled — slots-wave classNames + style: `root` lands on the group
 * wrapper div; `style` merges on the same element. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <ToggleButtonGroup
      ariaLabel="Slotted group"
      value="week"
      classNames={{ root: 'rounded-pill bg-s3 p-1' }}
      style={{ boxShadow: 'inset 0 0 12px rgba(0, 0, 0, 0.12)' }}
    >
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
};
