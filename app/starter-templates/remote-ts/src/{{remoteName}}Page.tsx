// {{remoteName}}Page — the component exposed to the MF host (`./{{remoteName}}Page`).
// It renders with DEMO data in local state (useState) — NO fetching by design: swap
// the data source for your API (TanStack Query + fetch(`${__API_BASE_URL__}/api/...`,
// or the dev-server /api proxy) and keep the JSX shape.
//
// Island rules (AGENTS.md has the full list):
// - Do NOT import global CSS here — styles.css loads once in standalone.tsx; in-shell
//   the host owns global CSS. Kit components are self-contained.
// - This file is the entire public surface of the remote: anything the host should
//   reach must be reachable from this component.
import { useMemo, useState } from 'react';
import { Badge, Button, Input, Table, Text, type TableColumn } from '@wakii/ui-kit';

interface Row {
  id: string;
  name: string;
  owner: string;
  status: 'todo' | 'doing' | 'done';
  updatedAt: string;
}

const STATUS_VARIANT = {
  todo: 'todo',
  doing: 'doing',
  done: 'done',
} as const;

const SEED_ROWS: Row[] = [
  { id: 'r1', name: 'Wire the remote into the shell', owner: 'alice', status: 'done', updatedAt: '2026-10-27T09:00:00Z' },
  { id: 'r2', name: 'Replace demo data with a real API', owner: 'bob', status: 'doing', updatedAt: '2026-10-28T14:30:00Z' },
  { id: 'r3', name: 'Add a gateway route', owner: 'carol', status: 'todo', updatedAt: '2026-10-29T08:15:00Z' },
];

export function {{remoteName}}Page() {
  // Demo state — replace with your data layer; keep this component a pure island.
  const [rows, setRows] = useState<Row[]>(SEED_ROWS);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(q));
  }, [rows, query]);

  const columns: TableColumn<Row>[] = [
    { key: 'name', title: 'Name' },
    { key: 'owner', title: 'Owner', render: (row) => <Text type="secondary">{row.owner}</Text> },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'updatedAt',
      title: 'Updated',
      render: (row) => <Text type="secondary">{row.updatedAt.slice(0, 10)}</Text>,
    },
  ];

  return (
    <section className="m-4 flex max-w-[860px] flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Filter rows…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          allowClear
          aria-label="Filter rows"
        />
        <Button
          type="primary"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                id: `r${prev.length + 1}`,
                name: `Demo row ${prev.length + 1}`,
                owner: 'you',
                status: 'todo',
                updatedAt: new Date().toISOString(),
              },
            ])
          }
        >
          Add row
        </Button>
      </div>
      <Table columns={columns} dataSource={filtered} rowKey="id" />
    </section>
  );
}
