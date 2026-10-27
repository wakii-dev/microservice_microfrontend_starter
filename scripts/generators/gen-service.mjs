#!/usr/bin/env node
// gen-service.mjs — `pnpm gen:service <tên> [--lang ts|go|spring] [--port N] [--db]`
// Sinh services/<tên>/ ĐÚNG conventions (01 Dockerfile, 02 health, 03 log,
// 04 envelope, 05 port, 06 env, 07 CORS, 08 gateway/prefix) + chèn compose
// (yaml pkg — không regex tay), gateway nginx (marker GEN:services), .env.example,
// pnpm-workspace.yaml (ts), conventions/05 port table, contracts stub, CI workflow.
// Output contract cho AI: --json → {created, modified, next_steps} (lib/result.mjs).
import fs from 'node:fs';
import path from 'node:path';
import {
  addServiceDependsOn,
  addServiceEnv,
  composeHasService,
  insertComposeService,
  insertWorkspacePackage,
  pickFreePort,
  usedHostPorts,
} from './lib/compose-yaml.mjs';
import { appendPortsTableRow } from './lib/docinsert.mjs';
import { appendEnvSection } from './lib/envfile.mjs';
import { exists, isDir, readText, writeNew, writeText } from './lib/io.mjs';
import { insertApiLocation } from './lib/nginx.mjs';
import { camel, dbRole, parseArgs, pascal, requireValidName, screaming, snake } from './lib/naming.mjs';
import { emit, emitError, helpText, GenResult } from './lib/result.mjs';
import { openapiStub } from './tpl/openapi-stub.mjs';
import { serviceGoFiles } from './tpl/service-go.mjs';
import { serviceSpringFiles } from './tpl/service-spring.mjs';
import { serviceTsFiles } from './tpl/service-ts.mjs';
import { workflowYml } from './tpl/workflow.mjs';

const HELP = helpText({
  usage: 'usage: pnpm gen:service <tên> [--lang ts|go|spring] [--port N] [--db] [--root <dir>] [--json] [--help]',
  summary:
    'Sinh service mới theo platform/conventions/01–08: Fastify TS mặc định (error envelope, /readyz, env fail-fast),' +
    ' chèn compose + gateway + .env.example + contracts stub + CI workflow. Idempotent-guard: thứ tồn tại → lỗi, không đè.',
  flags: [
    '<tên>                kebab-case, vd notification-svc (bắt buộc, positional đầu)',
    '--lang ts|go|spring  default ts (Fastify+TS). go = chi, spring = Boot 3',
    '--port N             port service (conventions/05). Mặc định: port trống kế tiếp 3002–3199',
    '--db                 có DB → DATABASE_URL + depends_on postgres + env *_DB_PASSWORD (role tự thêm: xem next_steps)',
    '--root <dir>         repo root (default: cwd — chạy từ gốc repo)',
    '--json               output JSON {created, modified, next_steps} — contract cho AI',
    '--help               trang này',
  ],
  examples: [
    'pnpm gen:service notification-svc',
    'pnpm gen:service search-svc --lang go --port 3005',
    'pnpm gen:service billing-svc --db --json',
  ],
  refs: [
    'platform/conventions/01-dockerfile-pattern.md (multi-stage, healthcheck chỉ ở compose)',
    'platform/conventions/02-healthcheck.md (/healthz + /readyz naked + mirror, readyz kiểm THẬT)',
    'platform/conventions/04-error-envelope.md · 05-ports.md · 06-configuration.md · 07-cors.md · 08-gateway-and-remotes.md',
  ],
});

const LANGS = new Set(['ts', 'go', 'spring']);

export function parseAndValidate(argv) {
  const { flags, positionals } = parseArgs(argv);
  const name = positionals[0];
  if (!name || flags.help) return { help: true };
  const lang = flags.lang ?? 'ts';
  if (!LANGS.has(lang)) throw new Error(`--lang phải thuộc ${[...LANGS].join('|')}, nhận: "${lang}"`);
  requireValidName(name, 'tên service');
  const port = flags.port == null ? null : Number(flags.port);
  if (flags.port != null && (!Number.isInteger(port) || port <= 1024 || port >= 65536)) {
    throw new Error(`--port không hợp lệ: ${flags.port}`);
  }
  return {
    help: false,
    name,
    lang,
    db: flags.db === true,
    port,
    root: flags.root ?? process.cwd(),
    json: flags.json === true,
  };
}

export function runGenService(opts) {
  const { name, lang, db } = opts;
  const root = opts.root;
  const res = new GenResult();

  // --- đọc file gốc + guards TOÀN BỘ trước khi ghi bất kỳ thứ gì ---
  const composePath = path.join(root, 'platform/docker-compose.yml');
  const nginxPath = path.join(root, 'platform/gateway/nginx/nginx.conf');
  const envPath = path.join(root, 'platform/.env.example');
  const workspacePath = path.join(root, 'pnpm-workspace.yaml');
  const portsDocPath = path.join(root, 'platform/conventions/05-ports.md');
  for (const p of [composePath, nginxPath, envPath]) {
    if (!exists(p)) {
      throw new Error(`không phải repo boilerplate — thiếu ${path.relative(root, p)} (chạy từ repo root hoặc --root <dir>)`);
    }
  }
  const composeText = readText(composePath);
  const nginxText = readText(nginxPath);
  const date = new Date().toISOString().slice(0, 10);

  const svcDir = path.join(root, 'services', name);
  if (isDir(svcDir)) throw new Error(`services/${name} đã tồn tại — idempotent-guard (xoá tay nếu muốn sinh lại)`);
  if (composeHasService(composeText, name)) throw new Error(`compose đã có service "${name}"`);
  if (exists(path.join(root, 'contracts/openapi', `${name}.yaml`))) throw new Error(`contracts/openapi/${name}.yaml đã tồn tại`);
  if (exists(path.join(root, '.github/workflows', `services-${name}.yml`)))
    throw new Error(`.github/workflows/services-${name}.yml đã tồn tại`);

  // --- port (conventions/05): --port hoặc port trống kế tiếp 3002–3199 ---
  const used = usedHostPorts(composeText);
  let port = opts.port;
  if (port == null) port = pickFreePort(used, 3002, 3199);
  else if (used.has(port)) throw new Error(`port ${port} đã dùng trong compose — chọn port trống (conventions/05)`);

  const ctx = {
    name,
    camel: camel(name),
    pascal: pascal(name),
    scream: screaming(name),
    snake: snake(name),
    dbRole: dbRole(name),
    port,
    db,
    date,
    pkg: 'com.example.' + camel(name),
    goModule: null,
  };

  // --- files theo lang ---
  let files;
  if (lang === 'go') {
    const goModPath = path.join(root, 'services/go-svc/go.mod');
    if (!exists(goModPath)) throw new Error('không thấy services/go-svc/go.mod — cần service Go mẫu để suy ra module base');
    ctx.goModule = (readText(goModPath).match(/^module (\S+)/m)?.[1] ?? '').replace(/\/services\/go-svc$/, '');
    if (!ctx.goModule) throw new Error('không parse được module base từ services/go-svc/go.mod');
    files = serviceGoFiles(ctx);
  } else if (lang === 'spring') {
    files = serviceSpringFiles(ctx);
  } else {
    files = serviceTsFiles(ctx);
  }

  // --- compose service block (conventions: container port CỐ ĐỊNH, ${}_PORT chỉ host-side) ---
  const environment = {};
  if (lang === 'spring') environment.SERVER_PORT = port;
  else environment.PORT = port;
  environment.JWT_SECRET = '${JWT_SECRET:?set in .env}';
  if (db) {
    if (lang === 'spring') {
      environment.SPRING_DATASOURCE_URL = 'jdbc:postgresql://postgres:5432/${POSTGRES_DB:?set in .env}';
      environment.SPRING_DATASOURCE_USERNAME = `${ctx.dbRole}`;
      environment.SPRING_DATASOURCE_PASSWORD = '${' + ctx.scream + '_DB_PASSWORD:?set in .env}';
    } else {
      environment.DATABASE_URL =
        'postgres://' + ctx.dbRole + ':${' + ctx.scream + '_DB_PASSWORD:?set in .env}@postgres:5432/${POSTGRES_DB:?set in .env}';
    }
  }
  environment.CORS_DEV_ORIGIN = '${CORS_DEV_ORIGIN:-}';
  environment.LOG_LEVEL = '${LOG_LEVEL:-info}';

  const serviceObj = {
    build: '../services/' + name,
    environment,
    ports: ['${' + ctx.scream + '_PORT:-' + port + '}:' + port],
  };
  if (db) serviceObj.depends_on = { postgres: { condition: 'service_healthy' } };
  // go = distroless KHÔNG healthcheck (conventions/02 rule 3); ts/spring có wget
  if (lang !== 'go') {
    serviceObj.healthcheck = {
      test: ['CMD', 'wget', '-qO-', `http://127.0.0.1:${port}/readyz`],
      interval: '5s',
      timeout: '3s',
      retries: 12,
      start_period: lang === 'spring' ? '30s' : '20s',
    };
  }

  const gatewayCondition = lang === 'go' ? 'service_started' : 'service_healthy';
  let newCompose = insertComposeService(
    composeText,
    name,
    serviceObj,
    ` gen:service ${date} — conventions/01/02/05/06 (chi tiết: services/${name}/README.md)`,
  );
  newCompose = addServiceDependsOn(newCompose, 'gateway', name, gatewayCondition);
  if (db) {
    newCompose = addServiceEnv(newCompose, 'postgres', `${ctx.scream}_DB_PASSWORD`, '${' + ctx.scream + '_DB_PASSWORD:?set in .env}');
  }

  const nginxRes = insertApiLocation(nginxText, name, port);
  if (!nginxRes) {
    throw new Error(
      `nginx.conf không có anchor "401 body" lẫn marker GEN:services — chèn block /api/${name} tay theo platform/conventions/08 rồi chạy lại`,
    );
  }

  const envRes = appendEnvSection(envPath, {
    header: `gen: ${name}`,
    vars: [
      {
        key: `${ctx.scream}_PORT`,
        value: String(port),
        comment: `port side HOST — container port cố định ${port} (conventions/05)`,
      },
      ...(db
        ? [{ key: `${ctx.scream}_DB_PASSWORD`, value: `change-me-${name}`, comment: `password role ${ctx.dbRole} (init script tạo)` }]
        : []),
    ],
  });

  let newWorkspace = null;
  if (lang === 'ts' && exists(workspacePath)) {
    newWorkspace = insertWorkspacePackage(readText(workspacePath), `services/${name}`);
  }

  let newPortsDoc = null;
  if (exists(portsDocPath)) {
    newPortsDoc = appendPortsTableRow(readText(portsDocPath), name, port, lang === 'ts' ? 'Fastify + TS' : lang === 'go' ? 'Go chi' : 'Spring Boot 3');
  }

  // --- GHI: service tree → các file chèn ---
  for (const [rel, content] of Object.entries(files)) {
    res.createdFile(path.relative(root, writeNew(path.join(svcDir, rel), content)));
  }
  if (lang === 'spring') {
    // mvnw + .mvn không sinh được — COPY từ spring-svc mẫu (Dockerfile dùng mvnw)
    const springSample = path.join(root, 'services/spring-svc');
    for (const item of ['mvnw', 'mvnw.cmd', '.mvn']) {
      const src = path.join(springSample, item);
      const dst = path.join(svcDir, item);
      if (exists(src)) {
        fs.cpSync(src, dst, { recursive: true });
        res.createdFile(path.relative(root, dst));
      } else {
        res.next(`copy ${item} từ spring-svc mẫu vào services/${name}/ (Dockerfile cần mvnw)`);
      }
    }
  }

  writeText(composePath, newCompose);
  res.modifiedFile('platform/docker-compose.yml');
  writeText(nginxPath, nginxRes.text);
  res.modifiedFile('platform/gateway/nginx/nginx.conf');
  if (nginxRes.created) res.next(`review: nginx.conf vừa tạo marker GEN:services — các lần gen sau tự chèn trong vùng đó`);
  if (envRes.added.length > 0) res.modifiedFile('platform/.env.example');
  if (newWorkspace != null) {
    writeText(workspacePath, newWorkspace);
    res.modifiedFile('pnpm-workspace.yaml');
  }
  if (newPortsDoc != null) {
    writeText(portsDocPath, newPortsDoc);
    res.modifiedFile('platform/conventions/05-ports.md');
  } else {
    res.next(`edit: platform/conventions/05-ports.md — thêm dòng port ${name} = ${port} vào bảng (anchor cũ không tìm thấy)`);
  }
  res.createdFile(path.relative(root, writeNew(path.join(root, 'contracts/openapi', `${name}.yaml`), openapiStub({ ...ctx }))));
  res.createdFile(
    path.relative(root, writeNew(path.join(root, '.github/workflows', `services-${name}.yml`), workflowYml(lang, ctx))),
  );

  // --- next_steps: directives AI làm tiếp (verb-first + path + hành động) ---
  if (lang === 'ts') {
    res.next(
      'run: pnpm install  # cập nhật pnpm-lock.yaml importer services/' + name + ' — CI --frozen-lockfile cần lock mới',
      `run: cd services/${name} && pnpm install --ignore-workspace  # sinh pnpm-lock.yaml standalone (conventions/01 rule 7)`,
      `verify: pnpm --filter ${name} test  # smoke conventions PASS`,
    );
  } else if (lang === 'go') {
    res.next(
      `run: cd services/${name} && go mod tidy && go build ./...  # sinh go.sum + build khung`,
      `add: services/${name}/main_test.go — httptest health shape + 401 envelope (conventions/02+04)`,
    );
  } else {
    res.next(`verify: cd services/${name} && ./mvnw -B test  # HealthCheckTest smoke (cần mvnw đã copy)`);
  }
  res.next(
    'run: pnpm lint:contracts  # spectral lint stub contracts/openapi/' + name + '.yaml PASS',
    `run: docker compose -f platform/docker-compose.yml --env-file platform/.env.example config -q  # compose VALID`,
    `edit: contracts/openapi/${name}.yaml — thay SAMPLE /items bằng domain thật (contract-first) rồi pnpm --filter ${name} generate:types`,
    `edit: services/${name}/src/routes/items.ts — thay SAMPLE bằng impl thật theo types`,
  );
  if (db) {
    res.next(
      `edit: platform/postgres/init/01-init.sh — tạo role ${ctx.dbRole} + password từ ${ctx.scream}_DB_PASSWORD (pattern node_svc)`,
      `note: sau khi sửa init script → docker compose down -v 1 lần để init chạy lại (gotchas CLAUDE.md)`,
    );
  }
  res.next(`verify: docker compose -f platform/docker-compose.yml --env-file platform/.env.example up -d ${db ? 'postgres ' : ''}${name} rồi curl localhost:${port}/readyz`);

  return res;
}

// --- CLI entry ---
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.length === 0) {
  process.stdout.write(HELP + '\n');
  process.exit(0);
}
try {
  const opts = parseAndValidate(argv);
  if (opts.help) {
    process.stdout.write(HELP + '\n');
    process.exit(0);
  }
  emit(runGenService(opts), { json: opts.json });
} catch (err) {
  const json = argv.includes('--json');
  emitError(err, { json });
  process.exit(1);
}
