// Tree stories — Default / ThreeLevels / ManyBranches / DarkTheme.
// Tree manages expanded state internally (uncontrolled — no controlled prop).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tree } from './index';
const meta = { title: 'Data Display/Tree', component: Tree, tags: ['autodocs'] } satisfies Meta<typeof Tree>;
export default meta;
type S = StoryObj<typeof meta>;

export const Default: S = {
  name: 'Default — chevron rotates 90° when open',
  args: { data: [
    { key: '1', label: 'Folder', children: [{ key: '1-1', label: 'File.ts' }] },
    { key: '2', label: 'README.md' },
  ], defaultExpandedKeys: ['1'] },
};

export const ThreeLevels: S = {
  name: '3 levels — src/app/ui-kit, level 1 pre-expanded',
  args: { data: [
    { key: 'src', label: 'src', children: [
      { key: 'app', label: 'app', children: [
        { key: 'ui', label: 'ui-kit', children: [{ key: 'ui-i', label: 'index.tsx' }] },
        { key: 'sh', label: 'shell', children: [{ key: 'sh-i', label: 'main.tsx' }] },
      ] },
      { key: 'pkg', label: 'package.json' },
    ] },
  ], defaultExpandedKeys: ['src'] },
};

export const ManyBranches: S = {
  name: 'Many branches — 3 folders × 3 files',
  args: { data: [
    { key: 'fe', label: 'frontend', children: [
      { key: 'fe-1', label: 'main.tsx' }, { key: 'fe-2', label: 'app.tsx' }, { key: 'fe-3', label: 'router.tsx' },
    ] },
    { key: 'be', label: 'backend', children: [
      { key: 'be-1', label: 'server.ts' }, { key: 'be-2', label: 'db.ts' }, { key: 'be-3', label: 'routes.ts' },
    ] },
    { key: 'ops', label: 'ops', children: [
      { key: 'ops-1', label: 'compose.yml' }, { key: 'ops-2', label: 'nginx.conf' }, { key: 'ops-3', label: 'ci.yaml' },
    ] },
  ], defaultExpandedKeys: ['fe', 'be'] },
};

export const DarkTheme: S = {
  args: { data: [] },
  name: 'Dark theme — hover bg-s3 follows tokens',
  render: () => (
    <div data-bp-theme="dark" className="w-64 rounded-xl bg-s2 p-4">
      <Tree data={[
        { key: '1', label: 'Folder', children: [
          { key: '1-1', label: 'File.ts' },
          { key: '1-2', label: 'README.md' },
        ] },
        { key: '2', label: 'LICENSE' },
      ]} defaultExpandedKeys={['1']} />
    </div>
  ),
};
