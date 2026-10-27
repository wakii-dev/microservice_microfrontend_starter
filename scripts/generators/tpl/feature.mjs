// feature.mjs — template feature cho gen-feature: Page (Card+Table) + api module
// (decode error envelope conventions/04) + 1 smoke test. Hai flavor:
//  - remote (app/remotes/*): API base qua DefinePlugin __API_BASE_URL__
//  - spa (app/*): API base qua import.meta.env.VITE_API_BASE_URL (vite/client)
// ctx: { name, camel, pascal (tên Page ĐỦ "Page"), appDir kind, date }.

const apiTsRemote = (ctx) => `// api/${ctx.name}.ts — fetch + decode error envelope (conventions/04). Sinh bởi
// gen-feature. Khi nối auth: thêm Authorization Bearer từ app/shared token-storage
// (READ-LOCKED — consume không sửa). API base qua DefinePlugin (conventions/06).
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public requestId: string | null = null,
    public details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope {
  error?: { code?: string; message?: string; requestId?: string | null; details?: unknown };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(__API_BASE_URL__ + path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let body: Envelope = {};
    try {
      body = (await res.json()) as Envelope;
    } catch {
      // body không phải JSON — giữ status
    }
    throw new ApiError(
      body.error?.code ?? (res.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL'),
      body.error?.message ?? 'HTTP ' + res.status,
      body.error?.requestId ?? null,
      body.error?.details ?? null,
    );
  }
  return (await res.json()) as T;
}

export interface ${ctx.pascal}Row {
  id: string;
  name: string;
  createdAt: string;
}

/** GET /api/${ctx.name} — sample resource; sửa path+type theo contract thật của bạn. */
export function list${ctx.pascal}s(): Promise<{ items: ${ctx.pascal}Row[]; total: number }> {
  return fetchJson('/api/${ctx.name}');
}
`;

const apiTsSpa = (ctx) => `// api/${ctx.name}.ts — fetch + decode error envelope (conventions/04). Sinh bởi
// gen-feature. Khi nối auth: thêm Authorization Bearer từ app/shared token-storage
// (READ-LOCKED — consume không sửa). API base qua VITE_API_BASE_URL (conventions/06 —
// set trong .env.local khi dev native gọi thẳng service).
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public requestId: string | null = null,
    public details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

interface Envelope {
  error?: { code?: string; message?: string; requestId?: string | null; details?: unknown };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let body: Envelope = {};
    try {
      body = (await res.json()) as Envelope;
    } catch {
      // body không phải JSON — giữ status
    }
    throw new ApiError(
      body.error?.code ?? (res.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL'),
      body.error?.message ?? 'HTTP ' + res.status,
      body.error?.requestId ?? null,
      body.error?.details ?? null,
    );
  }
  return (await res.json()) as T;
}

export interface ${ctx.pascal}Row {
  id: string;
  name: string;
  createdAt: string;
}

/** GET /api/${ctx.name} — sample resource; sửa path+type theo contract thật của bạn. */
export function list${ctx.pascal}s(): Promise<{ items: ${ctx.pascal}Row[]; total: number }> {
  return fetchJson('/api/${ctx.name}');
}
`;

function pageTsx(ctx) {
  return `// ${ctx.pascal} — khung Page (Card + Table + Alert lỗi + loading). Sinh bởi
// gen-feature ${ctx.date}. Sample gọi GET /api/${ctx.name} — đổi api/${ctx.name}.ts
// theo contract thật (contract-first: sửa contracts/openapi trước nếu là service mới).
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Table, type TableColumn } from '@wakii/ui-kit';
import { ApiError, list${ctx.pascal}s, type ${ctx.pascal}Row } from '../api/${ctx.name}.js';

type LoadState = 'loading' | 'error' | 'ready';

const columns: TableColumn<${ctx.pascal}Row>[] = [
  { key: 'id', title: 'ID', width: '200px' },
  { key: 'name', title: 'Tên' },
  { key: 'createdAt', title: 'Tạo lúc', width: '200px' },
];

export function ${ctx.pascal}() {
  const [rows, setRows] = useState<${ctx.pascal}Row[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [errText, setErrText] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const data = await list${ctx.pascal}s();
      setRows(data.items);
      setState('ready');
    } catch (err) {
      setErrText(err instanceof ApiError ? err.code + ': ' + err.message : String(err));
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card
      title="${ctx.pascal}"
      extra={
        <Button size="small" onClick={() => void load()} loading={state === 'loading'}>
          Tải lại
        </Button>
      }
    >
      {state === 'error' && (
        <Alert
          type="warning"
          message="Không tải được dữ liệu"
          description={errText + ' — kiểm tra service /api/${ctx.name} đã có chưa (BE) hoặc token (auth).'}
        />
      )}
      <Table<${ctx.pascal}Row>
        columns={columns}
        dataSource={rows}
        rowKey="id"
        striped
        size="small"
        loading={state === 'loading'}
      />
    </Card>
  );
}
`;
}

function pageTestTsx(ctx) {
  return `// Smoke ${ctx.pascal} — mock fetch: ready hiển thị rows, lỗi hiện Alert (envelope decode).
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ${ctx.pascal} } from '../src/pages/${ctx.pascal}.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('${ctx.pascal}', () => {
  it('fetch ok → render rows vào Table', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ items: [{ id: 'r-1', name: 'hàng thật', createdAt: '2026-01-01T00:00:00Z' }], total: 1 }), {
          status: 200,
        }),
      ),
    );
    render(<${ctx.pascal} />);
    await waitFor(() => expect(screen.getByText('hàng thật')).toBeInTheDocument());
  });

  it('fetch fail → Alert lỗi (không crash)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Missing token', requestId: null, details: null } }), {
          status: 401,
        }),
      ),
    );
    render(<${ctx.pascal} />);
    await waitFor(() => expect(screen.getByText(/Không tải được dữ liệu/)).toBeInTheDocument());
    expect(screen.getByText(/UNAUTHORIZED/)).toBeInTheDocument();
  });
});
`;
}

function readmeMd(ctx, kind) {
  return `# Feature \`${ctx.name}\`

Sinh bởi \`pnpm gen:feature ${ctx.name}\` (app kind: ${kind}).

| File | Vai trò |
|---|---|
| \`src/pages/${ctx.pascal}.tsx\` | Page (Card + Table + Alert lỗi + retry) |
| \`src/api/${ctx.name}.ts\` | fetch wrapper decode error envelope (conventions/04) |
| \`src/pages/${ctx.pascal}.test.tsx\` | smoke: ready + error path |

## Việc tiếp theo (AI directives)

1. Đổi resource thật: sửa path + type trong \`src/api/${ctx.name}.ts\` (contract-first — nếu là service mới, sửa contracts/openapi trước).
2. ${kind === 'remote' ? `Đăng ký expose: đã chèn './${ctx.pascal}' vào rspack.config.mjs (kiểm lại); shell slot: Route + RemoteSlot name + NavBar item (conventions/08).` : `Route đã chèn vào src/App.tsx tại marker GEN:routes (kiểm lại nếu không thấy); thêm menu item ở layout (marker GEN:menu).`}
3. Nối auth: thêm Bearer từ app/shared token-storage vào api module khi page cần token.
`;
}

export function featureFiles(ctx) {
  return {
    [`src/pages/${ctx.pascal}.tsx`]: pageTsx(ctx),
    [`src/api/${ctx.name}.ts`]: ctx.kind === 'remote' ? apiTsRemote(ctx) : apiTsSpa(ctx),
    [`src/pages/${ctx.pascal}.test.tsx`]: pageTestTsx(ctx),
    'FEATURE.md': readmeMd(ctx, ctx.kind),
  };
}
