// insert.test.mjs — unit tests for the INSERT/REMOVE primitives (mission requirement).
// Run: node --test scripts/generators/lib/insert.test.mjs  (node:test — no extra deps;
// node 24 requires an explicit FILE path, a directory argument does not scan).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { parse } from 'yaml';
import {
  addServiceDependsOn,
  addServiceEnv,
  composeHasService,
  insertComposeService,
  insertWorkspacePackage,
  pickFreePort,
  removeComposeService,
  removeWorkspacePackage,
  usedHostPorts,
} from './compose-yaml.mjs';
import {
  appendImport,
  appendPortsTableRow,
  insertAppRoute,
  insertRspackExpose,
  removeAppRoute,
  removePortsTableRow,
  removeRspackExpose,
} from './docinsert.mjs';
import { appendEnvSection, removeEnvKeys } from './envfile.mjs';
import { insertIntoMarkers, removeFromMarkers } from './io.mjs';
import { insertManifestService, removeManifestService } from './manifest.mjs';
import { insertApiLocation, insertRemoteMapLine, remoteMapLine, removeApiLocation } from './nginx.mjs';
import { camel, dbRole, parseArgs, pascal, requireValidName, screaming, snake } from './naming.mjs';

const COMPOSE = `# header comment stays intact
name: boilerplate
services:
  postgres:
    image: postgres:16-alpine # comment after value
    environment:
      POSTGRES_USER: \${POSTGRES_USER:?set in .env}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $\${POSTGRES_USER}"]
      interval: 5s
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
  gateway:
    image: nginx:1.27-alpine
    depends_on:
      auth-svc:
        condition: service_healthy
    environment:
      FOO: bar
volumes:
  pgdata:
`;

const NGINX = `http {
    map $uri $remote_up {
        ~^/remotes/tasks/    "http://remote-tasks:4001";
        default              "http://shell:3000";
    }

    server {
        listen 8080;
        # ---------- API: tasks → node-svc ----------
        location /api/tasks/ { proxy_pass http://node-svc:3001; }
        # ---------- 401 body theo error envelope chung (conventions/04) ----------
        location @unauthorized { return 401 '{}'; }
    }
}
`;

const WORKSPACE = `packages:
  - "app/*"
  - "services/node-svc"
catalog:
  react: 19.3.0
`;

// pre-rendered house-style block (what gen-service passes to insertComposeService)
const SVC_BLOCK = `  # gen:service 2026-10-27 — conventions/01/02/05/06
  notification-svc:
    build: ../services/notification-svc
    environment:
      PORT: 3002 # container port FIXED (conventions/05)
      JWT_SECRET: \${JWT_SECRET:?set in .env}
    ports:
      - "\${NOTIFICATION_SVC_PORT:-3002}:3002" # host-side
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3002/readyz"]
      interval: 5s
      timeout: 3s
      retries: 12
      start_period: 20s
`;

describe('compose-yaml insert', () => {
  it('insertComposeService — inserted block parses, original comments survive byte-identical', () => {
    const out = insertComposeService(COMPOSE, 'notification-svc', SVC_BLOCK);
    const doc = parse(out);
    assert.equal(doc.services['notification-svc'].build, '../services/notification-svc');
    assert.ok(out.includes('# header comment stays intact'), 'header comment lost');
    assert.ok(out.includes('image: postgres:16-alpine # comment after value'), 'inline comment lost');
    assert.ok(out.includes('# gen:service 2026-10-27'), 'block comment missing');
    // untouched flow arrays must survive byte-for-byte (lossless splice)
    assert.ok(out.includes('test: ["CMD-SHELL", "pg_isready'), 'flow array got reformatted');
    // volumes is still a top-level key after services, and the block lands BEFORE it
    assert.deepEqual(Object.keys(doc), ['name', 'services', 'volumes']);
    assert.ok(out.indexOf('notification-svc:') < out.indexOf('\nvolumes:'), 'block must stay inside services');
  });

  it('insertComposeService — duplicate key → throw (idempotent-guard)', () => {
    assert.throws(() => insertComposeService(COMPOSE, 'postgres', SVC_BLOCK), /idempotent-guard|already has service/);
  });

  it('addServiceDependsOn — gateway gains the entry; existing entries untouched; idempotent', () => {
    const out = addServiceDependsOn(COMPOSE, 'gateway', 'notification-svc', 'service_healthy', 'gen: gated on the new service readiness');
    const doc = parse(out);
    assert.equal(doc.services.gateway.depends_on['notification-svc'].condition, 'service_healthy');
    assert.equal(doc.services.gateway.depends_on['auth-svc'].condition, 'service_healthy');
    const out2 = addServiceDependsOn(out, 'gateway', 'notification-svc', 'service_healthy');
    assert.equal(Object.keys(parse(out2).services.gateway.depends_on).length, 2);
  });

  it('addServiceEnv — adds env into postgres for --db modes', () => {
    const out = addServiceEnv(COMPOSE, 'postgres', 'X_SVC_DB_PASSWORD', '${X_SVC_DB_PASSWORD:?set in .env}');
    assert.equal(parse(out).services.postgres.environment.X_SVC_DB_PASSWORD, '${X_SVC_DB_PASSWORD:?set in .env}');
  });

  it('usedHostPorts + pickFreePort — detect ports, pick the next free one', () => {
    const used = usedHostPorts(COMPOSE);
    assert.ok(used.has(5432));
    assert.equal(pickFreePort(used, 3002, 3199), 3002);
    assert.throws(() => pickFreePort(new Set([3002, 3003]), 3002, 3003), /--port/);
  });

  it('composeHasService — detects correctly', () => {
    assert.equal(composeHasService(COMPOSE, 'postgres'), true);
    assert.equal(composeHasService(COMPOSE, 'ghost'), false);
  });

  it('insertWorkspacePackage — appends the entry; duplicate → no-op', () => {
    const out = insertWorkspacePackage(WORKSPACE, 'services/auth-svc');
    assert.deepEqual(parse(out).packages, ['app/*', 'services/node-svc', 'services/auth-svc']);
    assert.equal(parse(out).catalog.react, '19.3.0');
    assert.equal(insertWorkspacePackage(out, 'services/auth-svc'), out, 'duplicate must be a no-op');
  });
});

describe('compose-yaml remove', () => {
  const WITH_SVC = insertComposeService(
    addServiceDependsOn(COMPOSE, 'gateway', 'notification-svc', 'service_healthy', 'gen: gated on the new service readiness'),
    'notification-svc',
    SVC_BLOCK,
  );

  it('removeComposeService — full roundtrip: gen + remove = byte-identical original', () => {
    const out = removeComposeService(WITH_SVC, 'notification-svc', { host: 'gateway', postgresEnvKeys: [] });
    assert.equal(out, COMPOSE, 'the roundtrip must restore the compose byte-for-byte');
  });

  it('removeComposeService — drops the service + gateway depends_on, keeps the rest parseable', () => {
    const out = removeComposeService(WITH_SVC, 'notification-svc', { host: 'gateway', postgresEnvKeys: [] });
    const doc = parse(out);
    assert.equal(doc.services['notification-svc'], undefined);
    assert.equal(doc.services.gateway.depends_on['notification-svc'], undefined);
    assert.equal(doc.services.gateway.depends_on['auth-svc'].condition, 'service_healthy', 'unrelated depends_on must survive');
    assert.deepEqual(Object.keys(doc), ['name', 'services', 'volumes']);
  });

  it('removeComposeService — purges postgres env keys (--db wiring)', () => {
    const withEnv = addServiceEnv(WITH_SVC, 'postgres', 'NOTIFICATION_SVC_DB_PASSWORD', '${NOTIFICATION_SVC_DB_PASSWORD:?set in .env}');
    const out = removeComposeService(withEnv, 'notification-svc', { host: 'gateway', postgresEnvKeys: ['NOTIFICATION_SVC_DB_PASSWORD'] });
    const doc = parse(out);
    assert.equal(doc.services.postgres.environment.NOTIFICATION_SVC_DB_PASSWORD, undefined, 'db password key must be purged');
    assert.ok(out.includes('POSTGRES_PORT'), 'the postgres ports block must survive');
  });

  it('removeComposeService — absent service → text unchanged (idempotent)', () => {
    assert.equal(removeComposeService(COMPOSE, 'ghost', { host: 'gateway', postgresEnvKeys: [] }), COMPOSE);
  });

  it('removeWorkspacePackage — drops the entry; absent → unchanged', () => {
    const withPkg = insertWorkspacePackage(WORKSPACE, 'services/auth-svc');
    const out = removeWorkspacePackage(withPkg, 'services/auth-svc');
    assert.deepEqual(parse(out).packages, ['app/*', 'services/node-svc']);
    assert.equal(removeWorkspacePackage(WORKSPACE, 'services/ghost'), WORKSPACE);
  });
});

describe('nginx insert', () => {
  it('insertApiLocation — first run CREATES markers at the anchor, block lands before the 401 section', () => {
    const res = insertApiLocation(NGINX, 'notification-svc', 3002);
    assert.ok(res.createdMarkers, 'must report created markers');
    const before401 = res.text.indexOf('location /api/notification-svc/');
    const after401 = res.text.indexOf('# ---------- 401 body');
    assert.ok(before401 !== -1 && after401 !== -1 && before401 < after401, 'block must precede the 401 anchor');
    assert.ok(res.text.includes('# >>> GEN:services'));
    // braces stay balanced
    assert.equal(count(res.text, '{'), count(res.text, '}'));
  });

  it('insertApiLocation — second run inserts INSIDE the marker region, no marker duplication', () => {
    const once = insertApiLocation(NGINX, 'a-svc', 3002).text;
    const twice = insertApiLocation(once, 'b-svc', 3003);
    assert.equal(twice.createdMarkers, false);
    assert.equal(count(twice.text, '# >>> GEN:services'), 1, 'marker got duplicated');
    assert.ok(twice.text.includes('location /api/b-svc/'));
  });

  it('insertApiLocation — duplicate location → throw', () => {
    const once = insertApiLocation(NGINX, 'a-svc', 3002).text;
    assert.throws(() => insertApiLocation(once, 'a-svc', 3002), /idempotent-guard/);
  });

  it('insertRemoteMapLine — the default line is never split mid-line (conf must stay parseable)', () => {
    const res = insertRemoteMapLine(NGINX, 'notifications', 4003);
    assert.ok(res, 'anchor must be found');
    // the default line stays intact on one line: "default ... ;"
    assert.match(res.text, /^ {8}default {2,}"http:\/\/shell:3000";$/m);
    assert.ok(res.text.includes('~^/remotes/notifications/    "http://remote-notifications:4003";'));
    // the new map entry lands BEFORE the default
    assert.ok(res.text.indexOf('~^/remotes/notifications/') < res.text.indexOf('default'));
    assert.equal(count(res.text, '{'), count(res.text, '}'));
  });

  it('remoteMapLine — matches the $remote_up map style', () => {
    assert.equal(remoteMapLine('x', 4010), '        ~^/remotes/x/    "http://remote-x:4010";\n');
  });

  it('insertIntoMarkers — open marker without close → clear throw', () => {
    const broken = `# >>> GEN:services\nno close marker\n${'anchor-marker'}`;
    assert.throws(
      () => insertIntoMarkers(broken, { open: '# >>> GEN:services', close: '# <<< GEN:services', anchor: 'anchor-marker', content: '' }),
      /close marker/,
    );
  });
});

describe('nginx remove', () => {
  it('removeApiLocation — strips exactly the generated block, keeps other blocks + markers', () => {
    const withA = insertApiLocation(NGINX, 'a-svc', 3002).text;
    const withB = insertApiLocation(withA, 'b-svc', 3003).text;
    const res = removeApiLocation(withB, 'a-svc');
    assert.ok(res.removed);
    assert.ok(!res.text.includes('/api/a-svc'), 'a-svc block must be gone');
    assert.ok(res.text.includes('/api/b-svc/'), 'b-svc block must survive');
    assert.ok(res.text.includes('# >>> GEN:services'), 'markers must survive');
    assert.ok(res.text.includes('location /api/tasks/'), 'pre-existing blocks must survive');
    assert.equal(count(res.text, '{'), count(res.text, '}'), 'braces must stay balanced');
  });

  it('removeApiLocation — no markers / no block → removed: false', () => {
    assert.equal(removeApiLocation(NGINX, 'ghost').removed, false);
    const withA = insertApiLocation(NGINX, 'a-svc', 3002).text;
    assert.equal(removeApiLocation(withA, 'ghost').removed, false);
  });
});

describe('envfile', () => {
  it('appendEnvSection — appends the section at EOF; existing keys are skipped', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'env-fx-'));
    const file = path.join(dir, '.env.example');
    fs.writeFileSync(file, 'JWT_SECRET=change-me\nLOG_LEVEL=info\n');
    appendEnvSection(file, {
      header: 'gen: x-svc',
      vars: [
        { key: 'X_SVC_PORT', value: '3002', comment: 'host-side port' },
        { key: 'LOG_LEVEL', value: 'debug', comment: 'already present — must be skipped' },
      ],
    });
    const text = fs.readFileSync(file, 'utf8');
    assert.match(text, /# --- gen: x-svc \(gen \d{4}-\d{2}-\d{2}\) ---\n# host-side port\nX_SVC_PORT=3002\n/);
    assert.ok(!text.includes('must be skipped'), 'an existing key must not be overwritten');
    assert.match(text, /^LOG_LEVEL=info$/m, 'the old value must survive');
  });

  it('appendEnvSection — missing file → clear throw', () => {
    assert.throws(() => appendEnvSection('/tmp/does-not-exist-xyz-123/.env', { header: 'x', vars: [] }), /not found/);
  });

  it('removeEnvKeys — drops the generated section + stray keys, keeps the rest', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'env-rm-'));
    const file = path.join(dir, '.env.example');
    fs.writeFileSync(file, 'JWT_SECRET=keep\nLOG_LEVEL=info\n');
    appendEnvSection(file, {
      header: 'gen: x-svc',
      vars: [
        { key: 'X_SVC_PORT', value: '3002', comment: 'port' },
        { key: 'X_SVC_DB_PASSWORD', value: 'pw', comment: 'role password' },
        { key: 'POSTGRES_X_SVC_DB', value: 'x_svc', comment: 'dedicated db' },
      ],
    });
    const { removed } = removeEnvKeys(file, {
      header: 'gen: x-svc',
      keys: ['X_SVC_PORT', 'X_SVC_DB_PASSWORD', 'POSTGRES_X_SVC_DB', 'POSTGRES_X_SVC_USER'],
    });
    assert.deepEqual(removed.sort(), ['POSTGRES_X_SVC_DB', 'X_SVC_DB_PASSWORD', 'X_SVC_PORT']);
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(!text.includes('X_SVC_PORT'), 'generated keys must be gone');
    assert.ok(!text.includes('gen: x-svc'), 'the emptied section header must be gone');
    assert.match(text, /^JWT_SECRET=keep$/m, 'unrelated vars survive');
    assert.match(text, /^LOG_LEVEL=info$/m);
    // second run → idempotent, nothing removed
    const again = removeEnvKeys(file, { header: 'gen: x-svc', keys: ['X_SVC_PORT'] });
    assert.deepEqual(again.removed, []);
  });
});

describe('docinsert', () => {
  it('appendPortsTableRow — inserts after the postgres row; missing anchor → null', () => {
    const md = `| Component | Port |\n|---|---|\n| postgres | 5432 | Postgres 16 |\n\nRules:\n`;
    const out = appendPortsTableRow(md, 'notification-svc', 3002, 'Fastify + TS');
    assert.match(out, /\| notification-svc \| 3002 \| Fastify \+ TS \|\n\nRules/);
    assert.equal(appendPortsTableRow('# no table here', 'x', 1, 'y'), null);
  });

  it('removePortsTableRow — drops only the exact generated row', () => {
    const md = `| Component | Port |\n| postgres | 5432 | Postgres 16 |\n| notification-svc | 3002 | Fastify + TS |\n| notifications | 4003 | FE remote |\n`;
    const out = removePortsTableRow(md, 'notification-svc');
    assert.ok(!out.includes('| notification-svc |'));
    assert.ok(out.includes('| notifications | 4003 |'), 'a row with a different name prefix must survive');
    assert.ok(out.includes('| postgres | 5432 |'));
    assert.equal(removePortsTableRow(md, 'ghost'), md);
  });

  it('insertAppRoute — inserts at the GEN:routes marker + .js import suffix', () => {
    const app = `import { Route, Routes } from 'react-router';
import { Home } from './pages/Home.js';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        {/* GEN:routes */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
`;
    const out = insertAppRoute(app, {
      routePath: '/invoices',
      componentName: 'InvoicesPage',
      importLine: "import { InvoicesPage } from './pages/InvoicesPage.js';",
    });
    assert.match(out, /import \{ InvoicesPage \} from '\.\/pages\/InvoicesPage\.js';/);
    const markerIdx = out.indexOf('{/* GEN:routes */}');
    const routeIdx = out.indexOf('<Route path="/invoices"');
    const catchAllIdx = out.indexOf('<Route path="*"');
    assert.ok(markerIdx < routeIdx && routeIdx < catchAllIdx, 'route must sit between the marker and the catch-all');
    assert.throws(() => insertAppRoute(out, { routePath: '/invoices', componentName: 'X', importLine: 'x' }), /idempotent-guard/);
  });

  it('insertAppRoute — no marker → insert at the START of the catch-all line, indentation kept; no catch-all → null', () => {
    const app = `import { Route } from 'react-router';
export const R = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
        <Route path="*" element={<Home />} />
  </Routes>
);
`;
    const out = insertAppRoute(app, { routePath: '/a', componentName: 'APage', importLine: "import { APage } from './pages/APage';" });
    assert.ok(out.indexOf('<Route path="/a"') < out.indexOf('<Route path="*"'));
    // the catch-all line keeps its 8-space indentation (never split mid-line)
    assert.match(out, /^ {8}<Route path="\*" element=\{<Home \/\>} \/>$/m);
    // the new route is indented 8 spaces to match
    assert.match(out, /^ {8}<Route path="\/a" element=\{<APage \/\>} \/>$/m);
    assert.equal(insertAppRoute('# no routes at all', { routePath: '/a', componentName: 'A', importLine: 'x' }), null);
  });

  it('removeAppRoute — drops the route + import lines only (generated names)', () => {
    const app = `import { Route, Routes } from 'react-router';
import { Home } from './pages/Home.js';
import { InvoicesPage } from './pages/InvoicesPage.js';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
`;
    const out = removeAppRoute(app, { routePath: '/invoices', componentName: 'InvoicesPage' });
    assert.ok(!out.includes('InvoicesPage'));
    assert.ok(out.includes('<Route path="/"'), 'other routes survive');
    assert.ok(out.includes('<Route path="*"'), 'catch-all survives');
    assert.equal(removeAppRoute(app, { routePath: '/ghost', componentName: 'GhostPage' }), app);
  });

  it('appendImport — after the last import; no imports → top of file', () => {
    assert.equal(appendImport("import A from 'a';\n\nconst x = 1;\n", "import B from 'b';"), "import A from 'a';\nimport B from 'b';\n\nconst x = 1;\n");
    assert.equal(appendImport('const x = 1;\n', "import B from 'b';"), "import B from 'b';\nconst x = 1;\n");
  });

  it('insertRspackExpose — inserts with the existing indent after exposes: {; duplicate → throw', () => {
    const cfg = `export default {
  plugins: [
    new ModuleFederationPlugin({
      exposes: {
        './TasksPage': './src/TasksPage.tsx',
      },
    }),
  ],
};
`;
    const out = insertRspackExpose(cfg, { exposedModule: './SummaryPage', file: './src/SummaryPage.tsx' });
    assert.match(out, /exposes: \{\n {8}'\.\/SummaryPage': '\.\/src\/SummaryPage\.tsx',\n {8}'\.\/TasksPage'/);
    assert.throws(() => insertRspackExpose(out, { exposedModule: './SummaryPage', file: 'x' }), /idempotent-guard/);
  });

  it('removeRspackExpose — drops the exact entry; absent → unchanged', () => {
    const cfg = `exposes: {
        './TasksPage': './src/TasksPage.tsx',
        './SummaryPage': './src/SummaryPage.tsx',
      },
`;
    const out = removeRspackExpose(cfg, './SummaryPage');
    assert.ok(!out.includes('SummaryPage'));
    assert.ok(out.includes('TasksPage'));
    assert.equal(removeRspackExpose(cfg, './Ghost'), cfg);
  });
});

describe('manifest', () => {
  it('insert/remove roundtrip on a temp copy', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'manifest-fx-'));
    const file = path.join(dir, 'stack-manifest.json');
    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          version: 1,
          services: [{ id: 'node-svc', type: 'be', paths: ['services/node-svc/**'], composeService: 'node-svc', envKeys: ['NODE_SVC_PORT'], requires: ['postgres'], devLocal: false }],
        },
        null,
        2,
      ) + '\n',
    );
    insertManifestService(file, { id: 'x-svc', type: 'be', paths: ['services/x-svc/**'], composeService: 'x-svc', gatewayBlocks: [], envKeys: ['X_SVC_PORT'], requires: [], devLocal: false });
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(manifest.services.map((s) => s.id), ['node-svc', 'x-svc']);
    assert.throws(() => insertManifestService(file, { id: 'x-svc' }), /idempotent-guard/);
    assert.equal(removeManifestService(file, 'x-svc'), true);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')).services.map((s) => s.id), ['node-svc']);
    assert.equal(removeManifestService(file, 'x-svc'), false, 'second removal is a no-op');
  });
});

describe('naming', () => {
  it('kebab transformations', () => {
    assert.equal(screaming('notification-svc'), 'NOTIFICATION_SVC');
    assert.equal(pascal('notification-svc'), 'NotificationSvc');
    assert.equal(camel('notification-svc'), 'notificationSvc');
    assert.equal(snake('notification-svc'), 'notification_svc');
    assert.equal(dbRole('notification-svc'), 'notification_svc', 'svc-suffixed name keeps its snake form');
    assert.equal(dbRole('billing'), 'billing_svc', 'non-svc name gets the _svc suffix');
  });

  it('requireValidName — rejects bad + reserved names', () => {
    assert.throws(() => requireValidName('Bad_Name'), /kebab-case/);
    assert.throws(() => requireValidName('node-svc'), /collides/);
    assert.throws(() => requireValidName('-abc'), /kebab-case/);
  });

  it('parseArgs — flag with value, flag=value, boolean flag, positional', () => {
    const { flags, positionals } = parseArgs(['notification-svc', '--lang', 'go', '--port=3005', '--db', '--json']);
    assert.deepEqual(positionals, ['notification-svc']);
    assert.equal(flags.lang, 'go');
    assert.equal(flags.port, '3005');
    assert.equal(flags.db, true);
    assert.equal(flags.json, true);
  });

  it('parseArgs — --db shared / --db=dedicated / bare --db', () => {
    assert.equal(parseArgs(['x', '--db', 'shared']).flags.db, 'shared');
    assert.equal(parseArgs(['x', '--db=dedicated']).flags.db, 'dedicated');
    assert.equal(parseArgs(['x', '--db']).flags.db, true, 'bare --db → the CLI maps it to shared');
    assert.equal(parseArgs(['x', '--db', 'none']).flags.db, 'none');
  });
});

/** Count substring occurrences. */
function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}
