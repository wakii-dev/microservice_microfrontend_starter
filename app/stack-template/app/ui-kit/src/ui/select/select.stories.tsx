// Select stories — states: selected/placeholder/disabled.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../checkbox/index';
import { RadioGroup } from '../radio/index';
import { Select } from './index';

const meta = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;
export default meta;
type S = StoryObj<typeof meta>;

type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { label: 'Cần làm', value: 'todo' },
  { label: 'Đang làm', value: 'in_progress' },
  { label: 'Xong', value: 'done' },
];

function OursSelected() {
  const [value, setValue] = useState<string>('todo');
  return <Select ariaLabel="Parity select — selected" options={OPTIONS} value={value} onChange={(v) => setValue(String(v))} />;
}

export const Selected: Story = {
  args: { ariaLabel: 'S', options: OPTIONS, value: 'todo' },
  render: () => <OursSelected />,
};
export const Placeholder: Story = {
  args: { ariaLabel: 'Parity select — placeholder', options: OPTIONS, placeholder: 'Chọn trạng thái…' },
};

// ── Coverage audit additions (antd Select parity) — EN demos ────────────────────

const TASK_OPTIONS = [
  { label: 'Learn TypeScript', value: 'ts' },
  { label: 'Learn Rust', value: 'rust' },
  { label: 'Write E2E tests', value: 'e2e' },
  { label: 'Fix nginx gateway', value: 'gateway' },
  { label: 'Saga compensation demo', value: 'saga' },
  { label: 'Seed demo users', value: 'seed' },
];

/** Filterable — type in the panel to narrow options (antd showSearch). */
export const Filterable: Story = {
  name: 'Filterable — type to search options',
  args: { ariaLabel: 'Filterable select', options: TASK_OPTIONS, filterable: true, placeholder: 'Pick a task…' },
};

/** Multiple — chips + select-all/clear-all inside the panel (antd mode="multiple"). */
export const Multiple: Story = {
  name: 'Multiple — chips + select all',
  args: { ariaLabel: 'Multiple select', options: OPTIONS },
  render: () => <SelectMultipleDemo />,
};

/** MaxSelectedCount — chips overflow folds into "+N" (antd maxTagCount). */
export const MaxSelectedCount: Story = {
  name: 'MaxSelectedCount — overflow becomes +N',
  args: { ariaLabel: 'Capped multiple select', options: OPTIONS },
  render: () => <SelectMaxSelectedDemo />,
};

/** OptionGroups — grouped headers inside the panel (antd options with options). */
export const OptionGroups: Story = {
  name: 'Option groups — grouped panel',
  args: {
    ariaLabel: 'Grouped select',
    placeholder: 'Pick a service…',
    options: [
      {
        label: 'Frontend',
        value: 'group-fe',
        items: [
          { label: 'Shell (host)', value: 'shell' },
          { label: 'Tasks remote', value: 'tasks' },
        ],
      },
      {
        label: 'Backend',
        value: 'group-be',
        items: [
          { label: 'node-svc', value: 'node' },
          { label: 'go-svc', value: 'go' },
        ],
      },
    ],
  },
};

/** Disabled — trigger locked, no panel. */
export const Disabled: Story = {
  args: { ariaLabel: 'Parity select — disabled', options: OPTIONS, value: 'todo', disabled: true },
};

/** Loading — spinner replaces the option list (antd loading). */
export const Loading: Story = {
  name: 'Loading — spinner in panel',
  args: { ariaLabel: 'Loading select', options: TASK_OPTIONS, loading: true },
};

/** ShowClear — × next to the chevron clears the value (antd allowClear). */
export const ShowClear: Story = {
  name: 'ShowClear — × clears the value',
  args: { ariaLabel: 'Clearable select', options: OPTIONS },
  render: () => <SelectShowClearDemo />,
};

/** Editable — trigger stays typable while the panel is open (free value). */
export const Editable: Story = {
  name: 'Editable — free-text value',
  args: { ariaLabel: 'Editable select', options: TASK_OPTIONS, editable: true, placeholder: 'Pick or type…' },
};

/** OptionDisabled — one locked option (antd disabled option). */
export const OptionDisabled: Story = {
  name: 'Option disabled — one locked option',
  args: {
    ariaLabel: 'Select with disabled option',
    options: [
      { label: 'Available plan', value: 'free' },
      { label: 'Legacy plan', value: 'legacy', disabled: true },
      { label: 'Enterprise plan', value: 'ent' },
    ],
    placeholder: 'Pick a plan…',
  },
};

/** DarkTheme — trigger + open panel on dark canvas. */
export const DarkTheme: Story = {
  name: 'DarkTheme — trigger + panel on dark canvas',
  args: { ariaLabel: 'Dark select', options: OPTIONS },
  render: () => (
    <div data-bp-theme="dark" className="w-72 rounded-xl bg-canvas p-4">
      <Select ariaLabel="Dark select" options={OPTIONS} value="in_progress" />
    </div>
  ),
};

function SelectMultipleDemo() {
  const [values, setValues] = useState<string[]>(['todo']);
  return (
    <div className="grid max-w-[320px] gap-3">
      <Select ariaLabel="Multiple select" options={OPTIONS} multiple value={values} onChange={(v) => setValues(Array.isArray(v) ? v : [v])} placeholder="Pick statuses…" />
      <p className="m-0 font-mono text-meta text-ink3">values: <strong className="text-ink">{JSON.stringify(values)}</strong></p>
    </div>
  );
}

function SelectMaxSelectedDemo() {
  const [values, setValues] = useState<string[]>(['todo', 'in_progress', 'done']);
  return (
    <div className="grid max-w-[320px] gap-3">
      <Select ariaLabel="Capped multiple select" options={OPTIONS} multiple maxSelectedCount={2} value={values} onChange={(v) => setValues(Array.isArray(v) ? v : [v])} placeholder="Pick statuses…" />
      <p className="m-0 font-mono text-meta text-ink3">3 selected, max 2 chips → "+1"</p>
    </div>
  );
}

function SelectShowClearDemo() {
  const [value, setValue] = useState<string>('todo');
  return (
    <div className="grid max-w-[320px] gap-3">
      <Select ariaLabel="Clearable select" options={OPTIONS} showClear value={value} onChange={(v) => setValue(String(v))} placeholder="Pick a status…" />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{value || '—'}</strong></p>
    </div>
  );
}

/* ── Real-world cases (mission #13 — real-world stories sweep) ── */

const CATALOG = [
  { name: 'Trail Runner Pro', category: 'Shoes', brand: 'Nimbus', price: 129 },
  { name: 'Field Watch 38', category: 'Accessories', brand: 'Krono', price: 249 },
  { name: 'Studio Headphones', category: 'Audio', brand: 'Nimbus', price: 199 },
  { name: 'City Backpack 22L', category: 'Bags', brand: 'Carryon', price: 89 },
  { name: 'Desk Lamp Arc', category: 'Home', brand: 'Lumo', price: 59 },
  { name: 'Running Tee Dry', category: 'Shoes', brand: 'Carryon', price: 35 },
];
const CATEGORIES = ['Shoes', 'Accessories', 'Audio', 'Bags', 'Home'];
const BRANDS = ['Nimbus', 'Krono', 'Carryon', 'Lumo'];

// Local wrapper — product filter: category + sort + brand checkboxes → live result count.
function FilterBarInner() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState('price-asc');
  const [brands, setBrands] = useState<string[]>([]);

  const filtered = CATALOG.filter(
    (p) => (!category || p.category === category) && (brands.length === 0 || brands.includes(p.brand)),
  );
  const sorted = [...filtered].sort((a, b) =>
    sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : a.name.localeCompare(b.name),
  );

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-label text-ink2">Category</span>
          <Select
            ariaLabel="Category"
            placeholder="All categories"
            value={category}
            onChange={(v) => setCategory(typeof v === 'string' ? v : undefined)}
            options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-label text-ink2">Sort by</span>
          <RadioGroup
            aria-label="Sort by"
            value={sort}
            onChange={setSort}
            options={[
              { label: 'Price ↑', value: 'price-asc' },
              { label: 'Price ↓', value: 'price-desc' },
              { label: 'Name', value: 'name' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-label text-ink2">Brand</span>
          <div className="flex flex-wrap gap-3">
            {BRANDS.map((brand) => (
              <Checkbox
                key={brand}
                checked={brands.includes(brand)}
                onChange={(checked) => setBrands((prev) => (checked ? [...prev, brand] : prev.filter((b) => b !== brand)))}
              >
                {brand}
              </Checkbox>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-s1 p-3">
        <span className="text-label text-ink2">
          {sorted.length} of {CATALOG.length} products
        </span>
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
          {sorted.map((p) => (
            <li key={p.name} className="flex items-center justify-between text-body text-ink">
              <span>
                {p.name} <span className="text-ink3">· {p.brand}</span>
              </span>
              <span className="text-ink2">${p.price}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const FilterBar: S = {
  name: 'FilterBar — product filters: category + sort + brands, live results',
  // args = props bắt buộc của Select (meta component) — renderdemo tự render wrapper
  args: { ariaLabel: 'Category', options: [] },
  render: () => <FilterBarInner />,
};

/* ── Customize pass (SÓNG-3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / trigger / panel / listbox
 * / option) + style passthrough (SÓNG-3 pattern). `root` lands on the outer
 * relative span (same element as `className`), `trigger` on the combobox button,
 * `panel`/`listbox`/`option` inside the dropdown; `style` lands on the outer span. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  args: { ariaLabel: 'Custom', options: [] },
  render: () => (
    <div className="grid max-w-[320px] gap-4">
      <Select
        ariaLabel="Custom styled select"
        options={TASK_OPTIONS}
        value="ts"
        classNames={{
          root: 'rounded-xl',
          trigger: 'border-st-done border-dashed',
          panel: 'rounded-lg border-st-done',
          listbox: 'bg-accent/5',
          option: 'tracking-wide',
        }}
        style={{ padding: 6, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
      />
    </div>
  ),
};
