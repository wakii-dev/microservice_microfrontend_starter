// Tree stories — Default / ThreeLevels / ManyBranches / DarkTheme / ShowLine
// + FileExplorer (project tree, selected-node status bar).
// Tree manages expanded state internally (uncontrolled — no controlled prop).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tree } from './index';
/** Expand/collapse hierarchy — chevron rotate, pre-expanded keys. */
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

// ── Case-coverage audit 2026-10-18 (antd parity: showLine) ──

export const ShowLine: S = {
  name: 'Show line — connector borders on nested levels',
  args: { data: [] },
  render: () => (
    <div className="w-64">
      <Tree
        showLine
        defaultExpandedKeys={['src', 'src-ui']}
        data={[
          { key: 'src', label: 'src', children: [
            { key: 'src-ui', label: 'ui', children: [
              { key: 'src-ui-badge', label: 'badge' },
              { key: 'src-ui-tree', label: 'tree' },
            ] },
            { key: 'src-hooks', label: 'hooks' },
          ] },
          { key: 'platform', label: 'platform' },
        ]}
      />
    </div>
  ),
};

// ── Real-world 2026-10-25 — file explorer: cây thư mục dự án 2 cấp thư mục,
// đếm file trên label thư mục, selected node theo dõi qua onNodeClick + thanh
// trạng thái dưới (pattern VS Code). API Tree hiện tại nhận label string +
// callback click (chưa có slot icon/slot selected trong node) — icon file và
// highlight node được thể hiện bằng chevron + showLine + status bar.

const PROJECT_FILES = [
  { key: 'src', label: 'src · 24 files', children: [
    { key: 'src-components', label: 'components · 14 files', children: [
      { key: 'src-components-button', label: 'Button.tsx' },
      { key: 'src-components-table', label: 'Table.tsx' },
      { key: 'src-components-modal', label: 'Modal.tsx' },
    ] },
    { key: 'src-hooks', label: 'hooks · 6 files', children: [
      { key: 'src-hooks-auth', label: 'useAuth.ts' },
      { key: 'src-hooks-theme', label: 'useTheme.ts' },
    ] },
    { key: 'src-index', label: 'index.tsx' },
  ] },
  { key: 'public', label: 'public · 2 files', children: [
    { key: 'public-favicon', label: 'favicon.svg' },
    { key: 'public-robots', label: 'robots.txt' },
  ] },
  { key: 'package', label: 'package.json' },
  { key: 'vite-config', label: 'vite.config.ts' },
];

function ExplorerDemo() {
  const [selected, setSelected] = useState('src/components/Button.tsx');
  return (
    <div className="w-72 rounded-xl border border-line bg-s2 p-3">
      <Tree
        showLine
        data={PROJECT_FILES}
        defaultExpandedKeys={['src', 'src-components']}
        onNodeClick={setSelected}
      />
      {/* Status bar — selected path như VS Code (Tree không có slot selected
       * trong node; selection hiển thị qua bar theo callback onNodeClick) */}
      <div className="mt-2 border-t border-line2 pt-2 text-meta text-ink3">
        Selected · <span className="font-mono text-ink2">{selected}</span>
      </div>
    </div>
  );
}

export const FileExplorer: S = {
  name: 'File explorer — project tree with file counts and selected-node bar',
  args: { data: [] },
  render: () => <ExplorerDemo />,
};
