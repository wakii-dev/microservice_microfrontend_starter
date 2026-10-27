// insert.test.mjs — unit test các hàm CHÈN (mission: test unit cho hàm chèn).
// Chạy: node --test scripts/generators/  (node:test — không cần install thêm).
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
  usedHostPorts,
} from './compose-yaml.mjs';
import { appendImport, appendPortsTableRow, insertAppRoute, insertRspackExpose } from './docinsert.mjs';
import { appendEnvSection } from './envfile.mjs';
import { insertApiLocation, insertRemoteMapLine, remoteMapLine } from './nginx.mjs';
import { camel, parseArgs, pascal, requireValidName, screaming, snake } from './naming.mjs';
import { insertIntoMarkers } from './io.mjs';

const COMPOSE = `# header comment giữ nguyên
name: boilerplate
services:
  postgres:
    image: postgres:16-alpine # comment sau value
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

describe('compose-yaml', () => {
  it('insertComposeService — chèn parse được, comment gốc giữ nguyên', () => {
    const out = insertComposeService(COMPOSE, 'notification-svc', { build: '../services/notification-svc' }, ' gen note');
    const doc = parse(out);
    assert.equal(doc.services['notification-svc'].build, '../services/notification-svc');
    assert.ok(out.includes('# header comment giữ nguyên'), 'comment header mất');
    assert.ok(out.includes('image: postgres:16-alpine # comment sau value'), 'comment inline mất');
    assert.ok(out.includes('gen note'), 'commentBefore service mới thiếu');
    // volumes vẫn là key cấp-1 sau services
    assert.deepEqual(Object.keys(doc), ['name', 'services', 'volumes']);
  });

  it('insertComposeService — trùng key → throw (idempotent-guard)', () => {
    assert.throws(() => insertComposeService(COMPOSE, 'postgres', {}), /idempotent-guard|đã có service/);
  });

  it('addServiceDependsOn — gateway nhận entry mới; entry có sẵn giữ nguyên', () => {
    const out = addServiceDependsOn(COMPOSE, 'gateway', 'notification-svc', 'service_healthy');
    const doc = parse(out);
    assert.equal(doc.services.gateway.depends_on['notification-svc'].condition, 'service_healthy');
    assert.equal(doc.services.gateway.depends_on['auth-svc'].condition, 'service_healthy');
    // idempotent — chạy lại không nhân đôi
    const out2 = addServiceDependsOn(out, 'gateway', 'notification-svc', 'service_healthy');
    assert.equal(Object.keys(parse(out2).services.gateway.depends_on).length, 2);
  });

  it('addServiceEnv — thêm env vào postgres cho --db', () => {
    const out = addServiceEnv(COMPOSE, 'postgres', 'X_SVC_DB_PASSWORD', '${X_SVC_DB_PASSWORD:?set in .env}');
    assert.equal(parse(out).services.postgres.environment.X_SVC_DB_PASSWORD, '${X_SVC_DB_PASSWORD:?set in .env}');
  });

  it('usedHostPorts + pickFreePort — nhận diện port, chọn trống kế tiếp', () => {
    const used = usedHostPorts(COMPOSE);
    assert.ok(used.has(5432));
    assert.equal(pickFreePort(used, 3002, 3199), 3002);
    assert.throws(() => pickFreePort(new Set([3002, 3003]), 3002, 3003), /--port/);
  });

  it('composeHasService — nhận diện đúng', () => {
    assert.equal(composeHasService(COMPOSE, 'postgres'), true);
    assert.equal(composeHasService(COMPOSE, 'ghost'), false);
  });

  it('insertWorkspacePackage — thêm dòng; trùng → no-op', () => {
    const ws = `packages:
  - "app/*"
  - "services/node-svc"
catalog:
  react: 19.3.0
`;
    const out = insertWorkspacePackage(ws, 'services/auth-svc');
    assert.deepEqual(parse(out).packages, ['app/*', 'services/node-svc', 'services/auth-svc']);
    assert.equal(parse(out).catalog.react, '19.3.0');
    assert.equal(insertWorkspacePackage(out, 'services/auth-svc'), out, 'trùng phải no-op');
  });
});

describe('nginx', () => {
  it('insertApiLocation — lần đầu TẠO marker tại anchor, block đứng trước 401', () => {
    const res = insertApiLocation(NGINX, 'notification-svc', 3002);
    assert.ok(res.created, 'phải báo created markers');
    const before401 = res.text.indexOf('location /api/notification-svc/');
    const after401 = res.text.indexOf('# ---------- 401 body');
    assert.ok(before401 !== -1 && after401 !== -1 && before401 < after401, 'block phải trước anchor 401');
    assert.ok(res.text.includes('# >>> GEN:services'));
    // cấu trúc braces còn cân bằng
    assert.equal(count(res.text, '{'), count(res.text, '}'));
  });

  it('insertApiLocation — lần 2 chèn TRONG vùng marker, không nhân marker', () => {
    const once = insertApiLocation(NGINX, 'a-svc', 3002).text;
    const twice = insertApiLocation(once, 'b-svc', 3003);
    assert.equal(twice.created, false);
    assert.equal(count(twice.text, '# >>> GEN:services'), 1, 'marker bị nhân');
    assert.ok(twice.text.includes('location /api/b-svc/'));
  });

  it('insertApiLocation — trùng location → throw', () => {
    const once = insertApiLocation(NGINX, 'a-svc', 3002).text;
    assert.throws(() => insertApiLocation(once, 'a-svc', 3002), /idempotent-guard/);
  });

  it('insertRemoteMapLine — dòng default KHÔNG bị cắt giữa (conf phải còn parse nổi)', () => {
    const res = insertRemoteMapLine(NGINX, 'notifications', 4003);
    assert.ok(res, 'phải tìm thấy anchor');
    // dòng default vẫn nguyên vẹn 1 dòng: "default ... ;"
    assert.match(res.text, /^ {8}default {2,}"http:\/\/shell:3000";$/m);
    assert.ok(res.text.includes('~^/remotes/notifications/    "http://remote-notifications:4003";'));
    // map entry mới đứng TRƯỚC default
    assert.ok(res.text.indexOf('~^/remotes/notifications/') < res.text.indexOf('default'));
    assert.equal(count(res.text, '{'), count(res.text, '}'));
  });

  it('remoteMapLine — format đúng pattern map $remote_up', () => {
    assert.equal(remoteMapLine('x', 4010), '        ~^/remotes/x/    "http://remote-x:4010";\n');
  });

  it('insertIntoMarkers — marker mở thiếu đóng → throw rõ', () => {
    const broken = `# >>> GEN:services\nkhông có đóng\n${'anchor-marker'}`;
    assert.throws(() => insertIntoMarkers(broken, { open: '# >>> GEN:services', close: '# <<< GEN:services', anchor: 'anchor-marker', content: '' }), /thiếu marker đóng/);
  });
});

describe('envfile', () => {
  it('appendEnvSection — thêm section cuối; key có sẵn → không đụng', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'env-fx-'));
    const file = path.join(dir, '.env.example');
    fs.writeFileSync(file, 'JWT_SECRET=change-me\nLOG_LEVEL=info\n');
    appendEnvSection(file, {
      header: 'gen: x-svc',
      vars: [
        { key: 'X_SVC_PORT', value: '3002', comment: 'port side HOST' },
        { key: 'LOG_LEVEL', value: 'debug', comment: 'đã có — phải bị bỏ qua' },
      ],
    });
    const text = fs.readFileSync(file, 'utf8');
    assert.match(text, /# --- gen: x-svc \(gen \d{4}-\d{2}-\d{2}\) ---\n# port side HOST\nX_SVC_PORT=3002\n/);
    assert.ok(!text.includes('phải bị bỏ qua'), 'key có sẵn không được ghi đè');
    assert.match(text, /^LOG_LEVEL=info$/m, 'giá trị cũ giữ nguyên');
  });

  it('appendEnvSection — file thiếu → throw rõ', () => {
    assert.throws(() => appendEnvSection('/tmp/khong-ton-tai-xyz-123/.env', { header: 'x', vars: [] }), /không tìm thấy/);
  });
});

describe('docinsert', () => {
  it('appendPortsTableRow — thêm sau dòng postgres; thiếu anchor → null', () => {
    const md = `| Thành phần | Port |\n|---|---|\n| postgres | 5432 | Postgres 16 |\n\nQuy tắc:\n`;
    const out = appendPortsTableRow(md, 'notification-svc', 3002, 'Fastify + TS');
    assert.match(out, /\| notification-svc \| 3002 \| Fastify \+ TS \|\n\nQuy tắc/);
    assert.equal(appendPortsTableRow('# không có bảng', 'x', 1, 'y'), null);
  });

  it('insertAppRoute — chèn tại marker GEN:routes + import suffix .js', () => {
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
    const out = insertAppRoute(app, { routePath: '/invoices', componentName: 'InvoicesPage', importLine: "import { InvoicesPage } from './pages/InvoicesPage.js';" });
    assert.match(out, /import \{ InvoicesPage \} from '\.\/pages\/InvoicesPage\.js';/);
    const markerIdx = out.indexOf('{/* GEN:routes */}');
    const routeIdx = out.indexOf('<Route path="/invoices"');
    const catchAllIdx = out.indexOf('<Route path="*"');
    assert.ok(markerIdx < routeIdx && routeIdx < catchAllIdx, 'route phải giữa marker và catch-all');
    assert.throws(() => insertAppRoute(out, { routePath: '/invoices', componentName: 'X', importLine: 'x' }), /idempotent-guard/);
  });

  it('insertAppRoute — không có marker → chèn đầu DÒNG catch-all, giữ indent; không có catch-all → null', () => {
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
    // dòng catch-all phải còn nguyên indent 8 space (không bị cắt giữa dòng)
    assert.match(out, /^ {8}<Route path="\*" element=\{<Home \/\>} \/>$/m);
    // route mới thụt 8 space đúng style
    assert.match(out, /^ {8}<Route path="\/a" element=\{<APage \/\>} \/>$/m);
    assert.equal(insertAppRoute('# không có route nào', { routePath: '/a', componentName: 'A', importLine: 'x' }), null);
  });

  it('appendImport — sau import cuối; file không import → đầu file', () => {
    assert.equal(appendImport("import A from 'a';\n\nconst x = 1;\n", "import B from 'b';"), "import A from 'a';\nimport B from 'b';\n\nconst x = 1;\n");
    assert.equal(appendImport('const x = 1;\n', "import B from 'b';"), "import B from 'b';\nconst x = 1;\n");
  });

  it('insertRspackExpose — chèn đúng indent sau exposes: {; trùng → throw', () => {
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
});

describe('naming', () => {
  it('biến đổi kebab → các dạng', () => {
    assert.equal(screaming('notification-svc'), 'NOTIFICATION_SVC');
    assert.equal(pascal('notification-svc'), 'NotificationSvc');
    assert.equal(camel('notification-svc'), 'notificationSvc');
    assert.equal(snake('notification-svc'), 'notification_svc');
  });

  it('requireValidName — chặn tên xấu + reserved', () => {
    assert.throws(() => requireValidName('Bad_Name'), /kebab-case/);
    assert.throws(() => requireValidName('node-svc'), /trùng/);
    assert.throws(() => requireValidName('-abc'), /kebab-case/);
  });

  it('parseArgs — flag giá trị, flag=giá trị, flag bool, positional', () => {
    const { flags, positionals } = parseArgs(['notification-svc', '--lang', 'go', '--port=3005', '--db', '--json']);
    assert.deepEqual(positionals, ['notification-svc']);
    assert.equal(flags.lang, 'go');
    assert.equal(flags.port, '3005');
    assert.equal(flags.db, true);
    assert.equal(flags.json, true);
  });
});

/** Đếm số lần xuất hiện của chuỗi con. */
function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}
