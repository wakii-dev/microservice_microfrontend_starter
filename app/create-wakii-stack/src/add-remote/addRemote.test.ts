// Tests addRemote — integration over a mini stack-template fixture in tmp:
// the template `tasks` remote (trimmed files, real tokens) + a scaffolded dest
// stack skeleton. Asserts the identity renames, the untouched API contract
// strings, every registration patch and the port logic. No network, no pnpm.
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addRemote } from './addRemote.js';

const RSPACK = `const publicPath = process.env.REMOTE_PUBLIC_PATH || (isDev ? 'http://localhost:4001/' : '/remotes/tasks/');
export default {
  plugins: [
    new ModuleFederationPlugin({
      name: 'tasks',
      exposes: {
        './TasksPage': './src/TasksPage.tsx',
      },
    }),
  ],
  devServer: {
    port: Number(process.env.REMOTE_TASKS_PORT || 4001),
    proxy: [{ context: ['/api'], target: \`http://localhost:\${process.env.NODE_SVC_PORT || 3001}\` }],
  },
};
`;

const PAGE = `export function TasksPage() {
  const tasksKey = useMemo(() => ['tasks', search] as const, [search]);
  return (
    <section aria-label="Quản lý tasks">
      <h1 className="m-0 text-h1">Tasks</h1>
    </section>
  );
}
export default TasksPage;
`;

const API = `// API layer remote \`tasks\` — contract contracts/openapi/tasks.yaml.
export function fetchTasks() {
  return api.get<TaskList>('/api/tasks?limit=10');
}
`;

let root: string;
let templateRoot: string;
let dest: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'cws-add-remote-'));
  templateRoot = join(root, 'stack-template');
  dest = join(root, 'stack');
  const tasks = join(templateRoot, 'app', 'remotes', 'tasks');
  await mkdir(join(tasks, 'src'), { recursive: true });
  await mkdir(join(tasks, 'tests'), { recursive: true });
  await mkdir(join(dest, 'platform', 'gateway', 'nginx'), { recursive: true });
  await mkdir(join(dest, 'platform', 'gateway-traefik'), { recursive: true });
  await mkdir(join(dest, 'app', 'shell', 'src'), { recursive: true });

  await writeFile(join(tasks, 'rspack.config.mjs'), RSPACK);
  await writeFile(
    join(tasks, 'package.json'),
    JSON.stringify({
      name: '@wakii/remote-tasks',
      description: 'FE remote `tasks` — expose ./TasksPage',
      dependencies: { '@wakii/fe-shared': 'workspace:*', '@wakii/ui-kit': 'workspace:*' },
    }),
  );
  await writeFile(join(tasks, 'src', 'TasksPage.tsx'), PAGE);
  await writeFile(join(tasks, 'src', 'api.ts'), API);
  await writeFile(
    join(tasks, 'src', 'standalone.tsx'),
    "import { TasksPage } from './TasksPage';\n// Standalone debug — remote `tasks`\n",
  );
  await writeFile(join(tasks, 'index.html'), '<!doctype html><title>Remote: tasks (standalone debug)</title>\n');
  await writeFile(
    join(tasks, 'nginx.conf'),
    '# Remote `tasks` static — port cố định 4001\nserver {\n  listen 4001;\n  location /remotes/tasks/ {\n    alias /usr/share/nginx/html/;\n  }\n}\n',
  );
  await writeFile(
    join(tasks, 'Dockerfile'),
    'FROM node:22-alpine\nCOPY app/remotes/tasks/package.json app/remotes/tasks/\nRUN pnpm install --frozen-lockfile --filter @wakii/remote-tasks...\nEXPOSE 4001\n',
  );
  await writeFile(join(tasks, 'tests', 'TasksPage.test.tsx'), "import { TasksPage } from '../src/TasksPage';\n");
  await writeFile(join(tasks, 'README.md'), '# @wakii/remote-tasks\n\nDev: `pnpm --filter @wakii/remote-tasks dev` on :4001.\n');

  await writeFile(
    join(dest, 'platform', 'docker-compose.yml'),
    [
      'services:',
      '  postgres:',
      '    volumes:',
      '      - pgdata:/var/lib/postgresql/data',
      '',
      '  remote-tasks:',
      '    ports:',
      '      - "${REMOTE_TASKS_PORT:-4001}:4001"',
      '',
      '  remote-activity:',
      '    ports:',
      '      - "${REMOTE_ACTIVITY_PORT:-4002}:4002"',
      '',
      'volumes:',
      '  pgdata:',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(dest, 'platform', 'gateway', 'nginx', 'nginx.conf'),
    [
      'http {',
      '    default_type application/octet-stream;',
      '    map $uri $remote_up {',
      '        ~^/remotes/tasks/    "http://remote-tasks:4001";',
      '        ~^/remotes/activity/ "http://remote-activity:4002";',
      '        default              "http://shell:3000";',
      '    }',
      '}',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(dest, 'platform', 'gateway-traefik', 'traefik-dynamic.yml'),
    [
      'http:',
      '  middlewares:',
      '    strip-remotes-activity:',
      '      stripPrefix:',
      '        prefixes: ["/remotes/activity"]',
      '',
      '  routers:',
      '    remotes-activity:',
      '      rule: "PathPrefix(`/remotes/activity`)"',
      '      service: remote-activity',
      '      priority: 50',
      '    shell:',
      '      rule: "PathPrefix(`/`)"',
      '      priority: 1',
      '',
      '  services:',
      '    remote-activity:',
      '      loadBalancer:',
      '        servers: [{ url: "http://remote-activity:4002" }]',
      '    shell:',
      '      loadBalancer:',
      '        servers: [{ url: "http://shell:3000" }]',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(dest, 'app', 'shell', 'src', 'remote-urls.ts'),
    [
      "  (globalThis as Record<string, unknown>)['__REMOTE_URLS__'] = {",
      '    tasks: __REMOTE_TASKS_URL__,',
      '    activity: __REMOTE_ACTIVITY_URL__,',
      '  };',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(dest, 'app', 'shell', 'src', 'env.d.ts'),
    'declare const __REMOTE_TASKS_URL__: string;\ndeclare const __REMOTE_ACTIVITY_URL__: string;\n',
  );
  await writeFile(
    join(dest, 'app', 'shell', 'rspack.config.mjs'),
    [
      "const remoteActivityUrl = process.env.REMOTE_ACTIVITY_URL || '/remotes/activity/remoteEntry.js';",
      '      __REMOTE_ACTIVITY_URL__: JSON.stringify(remoteActivityUrl),',
      '        activity: `activity@${remoteActivityUrl}`,',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(dest, 'app', 'shell', 'vitest.config.ts'),
    '  define: {\n    __REMOTE_TASKS_URL__: "\'http://buildtime:4001/remoteEntry.js\'",\n    __REMOTE_ACTIVITY_URL__: "\'http://buildtime:4002/remoteEntry.js\'",\n  },\n',
  );
  await writeFile(
    join(dest, 'platform', '.env.example'),
    [
      'GATEWAY_PORT=8080',
      'REMOTE_TASKS_PORT=4001',
      'REMOTE_ACTIVITY_PORT=4002',
      'REMOTE_TASKS_URL=http://remote-tasks:4001',
      'REMOTE_ACTIVITY_URL=http://remote-activity:4002',
      'CORS_DEV_ORIGIN=http://localhost:3000,http://localhost:4001,http://localhost:4002',
      '',
    ].join('\n'),
  );
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('addRemote — identity renames in the generated remote', () => {
  it('renames files, component, expose key, MF name, port and env vars', async () => {
    const result = await addRemote({ name: 'inventory', dest, templateRoot, port: 4003 });

    expect(result.port).toBe(4003);
    // whole-file renames landed
    expect(existsSync(join(dest, 'app', 'remotes', 'inventory', 'src', 'InventoryPage.tsx'))).toBe(true);
    expect(existsSync(join(dest, 'app', 'remotes', 'inventory', 'src', 'TasksPage.tsx'))).toBe(false);
    expect(existsSync(join(dest, 'app', 'remotes', 'inventory', 'tests', 'InventoryPage.test.tsx'))).toBe(true);

    const rspack = await readFile(join(dest, 'app', 'remotes', 'inventory', 'rspack.config.mjs'), 'utf8');
    expect(rspack).toContain("name: 'inventory'");
    expect(rspack).toContain("'./InventoryPage': './src/InventoryPage.tsx'");
    expect(rspack).toContain('/remotes/inventory/');
    expect(rspack).toContain('REMOTE_INVENTORY_PORT || 4003');
    expect(rspack).not.toContain('4001');
    // API proxy target stays node-svc
    expect(rspack).toContain('process.env.NODE_SVC_PORT || 3001');

    const pkg = JSON.parse(
      await readFile(join(dest, 'app', 'remotes', 'inventory', 'package.json'), 'utf8'),
    ) as { name: string; dependencies: Record<string, string> };
    expect(pkg.name).toBe('@wakii/remote-inventory');
    expect(pkg.dependencies['@wakii/ui-kit']).toBe('latest'); // registry dep like siblings
    expect(pkg.dependencies['@wakii/fe-shared']).toBe('workspace:*');

    // page content: component + h1 renamed; query key + domain identifiers kept
    const page = await readFile(join(dest, 'app', 'remotes', 'inventory', 'src', 'InventoryPage.tsx'), 'utf8');
    expect(page).toContain('export function InventoryPage()');
    expect(page).toContain('>Inventory<');
    expect(page).toContain("['tasks', search]");
    expect(page).toContain('Quản lý tasks'); // domain aria-label — kept intentionally

    // API contract strings byte-identical
    const api = await readFile(join(dest, 'app', 'remotes', 'inventory', 'src', 'api.ts'), 'utf8');
    expect(api).toContain("'/api/tasks?limit=10'");
    expect(api).toContain('contracts/openapi/tasks.yaml');
    expect(api).toContain('fetchTasks');

    // standalone + html title + nginx + dockerfile
    const standalone = await readFile(join(dest, 'app', 'remotes', 'inventory', 'src', 'standalone.tsx'), 'utf8');
    expect(standalone).toContain("import { InventoryPage } from './InventoryPage';");
    expect(standalone).toContain('remote `inventory`');
    const html = await readFile(join(dest, 'app', 'remotes', 'inventory', 'index.html'), 'utf8');
    expect(html).toContain('<title>Remote: inventory (standalone debug)</title>');
    const nginx = await readFile(join(dest, 'app', 'remotes', 'inventory', 'nginx.conf'), 'utf8');
    expect(nginx).toContain('listen 4003;');
    expect(nginx).toContain('location /remotes/inventory/ {');
    const dockerfile = await readFile(join(dest, 'app', 'remotes', 'inventory', 'Dockerfile'), 'utf8');
    expect(dockerfile).toContain('COPY app/remotes/inventory/package.json app/remotes/inventory/');
    expect(dockerfile).toContain('--filter @wakii/remote-inventory...');
    expect(dockerfile).toContain('EXPOSE 4003');

    // README: renamed + wire-in appendix
    const readme = await readFile(join(dest, 'app', 'remotes', 'inventory', 'README.md'), 'utf8');
    expect(readme).toContain('# @wakii/remote-inventory');
    expect(readme).toContain('## Wired into the stack by `create-wakii-stack add-remote`');
    expect(readme).toContain('exposedModule="./InventoryPage"');
    expect(readme).toContain('conventions/08-gateway-and-remotes.md');
  });
});

describe('addRemote — stack registration patches', () => {
  it('patches compose, nginx map, traefik, shell registry and env example', async () => {
    const result = await addRemote({ name: 'inventory', dest, templateRoot, port: 4003 });

    expect(result.patched).toHaveLength(8);
    expect(result.skipped).toHaveLength(0);

    const compose = await readFile(join(dest, 'platform', 'docker-compose.yml'), 'utf8');
    expect(compose).toContain('  remote-inventory:');
    expect(compose).toContain('"${REMOTE_INVENTORY_PORT:-4003}:4003"');
    // lands before the top-level volumes key — never nested under postgres
    expect(compose.indexOf('  remote-inventory:')).toBeGreaterThan(compose.indexOf('    volumes:'));
    expect(compose.indexOf('  remote-inventory:')).toBeLessThan(compose.indexOf('\nvolumes:'));
    expect(compose).toContain('    volumes:\n      - pgdata:/var/lib/postgresql/data');

    const nginx = await readFile(join(dest, 'platform', 'gateway', 'nginx', 'nginx.conf'), 'utf8');
    const inv = nginx.indexOf('~^/remotes/inventory/');
    expect(inv).toBeGreaterThan(nginx.indexOf('default_type'));
    expect(inv).toBeLessThan(nginx.indexOf('default              "http://shell:3000";'));
    expect(nginx).toContain('"http://remote-inventory:4003";');

    const traefik = await readFile(join(dest, 'platform', 'gateway-traefik', 'traefik-dynamic.yml'), 'utf8');
    expect(traefik).toContain('strip-remotes-inventory');
    expect(traefik).toContain('rule: "PathPrefix(`/remotes/inventory`)"');
    expect(traefik).toContain('servers: [{ url: "http://remote-inventory:4003" }]');

    const remoteUrls = await readFile(join(dest, 'app', 'shell', 'src', 'remote-urls.ts'), 'utf8');
    expect(remoteUrls).toContain('inventory: __REMOTE_INVENTORY_URL__,');
    const envDts = await readFile(join(dest, 'app', 'shell', 'src', 'env.d.ts'), 'utf8');
    expect(envDts).toContain('declare const __REMOTE_INVENTORY_URL__: string;');
    const shellRspack = await readFile(join(dest, 'app', 'shell', 'rspack.config.mjs'), 'utf8');
    expect(shellRspack).toContain("const remoteInventoryUrl = process.env.REMOTE_INVENTORY_URL || '/remotes/inventory/remoteEntry.js';");
    expect(shellRspack).toContain('__REMOTE_INVENTORY_URL__: JSON.stringify(remoteInventoryUrl),');
    expect(shellRspack).toContain('inventory: `inventory@${remoteInventoryUrl}`,');
    const vitest = await readFile(join(dest, 'app', 'shell', 'vitest.config.ts'), 'utf8');
    expect(vitest).toContain("__REMOTE_INVENTORY_URL__: \"'http://buildtime:4003/remoteEntry.js'\",");

    const env = await readFile(join(dest, 'platform', '.env.example'), 'utf8');
    expect(env).toContain('REMOTE_INVENTORY_PORT=4003');
    expect(env).toContain('REMOTE_INVENTORY_URL=http://remote-inventory:4003');
    expect(env).toContain('http://localhost:4002,http://localhost:4003');
  });

  it('reports skipped patches instead of failing when a file is absent', async () => {
    await rm(join(dest, 'platform', 'gateway-traefik'), { recursive: true, force: true });
    const result = await addRemote({ name: 'inventory', dest, templateRoot, port: 4003 });
    expect(result.patched).toHaveLength(7);
    expect(result.skipped).toEqual(['platform/gateway-traefik/traefik-dynamic.yml']);
  });
});

describe('addRemote — port selection', () => {
  it('auto-picks the first free port >= 4003 (skips 4003 when taken)', async () => {
    const result = await addRemote({ name: 'first', dest, templateRoot });
    expect(result.port).toBe(4003);

    // second remote on the same stack must not collide with 4003
    const result2 = await addRemote({ name: 'second', dest, templateRoot });
    expect(result2.port).toBe(4004);
  });

  it('throws on an explicit colliding port and rolls nothing forward', async () => {
    await expect(addRemote({ name: 'inventory', dest, templateRoot, port: 4001 })).rejects.toThrow(
      /already referenced/,
    );
    expect(existsSync(join(dest, 'app', 'remotes', 'inventory'))).toBe(false);
  });
});

describe('addRemote — guard rails', () => {
  it('rejects an invalid name before writing anything', async () => {
    await expect(addRemote({ name: 'Bad_Name', dest, templateRoot })).rejects.toThrow(/Invalid remote name/);
    expect(existsSync(join(dest, 'app', 'remotes'))).toBe(false);
  });

  it('rejects a duplicate remote dir', async () => {
    await addRemote({ name: 'inventory', dest, templateRoot, port: 4003 });
    await expect(addRemote({ name: 'inventory', dest, templateRoot, port: 4004 })).rejects.toThrow(
      /already exists/,
    );
  });

  it('rejects a dest that is not a scaffolded stack', async () => {
    const empty = join(root, 'not-a-stack');
    await mkdir(empty, { recursive: true });
    await expect(addRemote({ name: 'inventory', dest: empty, templateRoot })).rejects.toThrow(
      /Not a scaffolded stack/,
    );
  });
});
