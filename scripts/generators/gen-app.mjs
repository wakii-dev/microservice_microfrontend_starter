#!/usr/bin/env node
// gen-app.mjs — `pnpm gen:app <tên> [--remote] [--port N]`
// Non-remote: SPA Vite TS + @wakii/ui-kit + Layout kit + dark toggle (pattern
// app/admin) — dev-only, KHÔNG đụng compose/nginx.
// --remote: MF remote Rspack (pattern app/remotes/tasks) + compose entry static
// (port trống kế tiếp 4003+) + gateway map /remotes/<name>/ + .env REMOTE_* —
// shell slot = TODO note (không tự sửa shell).
// Output contract: --json → {created, modified, next_steps} (lib/result.mjs).
import fs from 'node:fs';
import path from 'node:path';
import {
  composeHasService,
  insertComposeService,
  pickFreePort,
  usedHostPorts,
} from './lib/compose-yaml.mjs';
import { appendPortsTableRow } from './lib/docinsert.mjs';
import { appendEnvSection } from './lib/envfile.mjs';
import { exists, isDir, readText, writeNew, writeText } from './lib/io.mjs';
import { insertRemoteMapLine } from './lib/nginx.mjs';
import { camel, parseArgs, pascal, requireValidName, screaming } from './lib/naming.mjs';
import { emit, emitError, helpText, GenResult } from './lib/result.mjs';
import { appRemoteFiles } from './tpl/app-remote.mjs';
import { appSpaFiles } from './tpl/app-spa.mjs';

const HELP = helpText({
  usage: 'usage: pnpm gen:app <tên> [--remote] [--port N] [--root <dir>] [--json] [--help]',
  summary:
    'Sinh app FE mới: SPA Vite TS + @wakii/ui-kit (Layout kit + dark toggle, pattern app/admin).' +
    ' --remote → MF remote Rspack (pattern app/remotes/tasks) + compose static + gateway /remotes/<name>/ + .env.',
  flags: [
    '<tên>           kebab-case, vd reports (bắt buộc, positional đầu)',
    '--remote        sinh MF remote tại app/remotes/<tên> (mặc định: SPA tại app/<tên>, dev-only)',
    '--port N        port. SPA dev: trống kế tiếp 5174+. Remote: trống kế tiếp 4003+ trong compose',
    '--root <dir>    repo root (default: cwd)',
    '--json          output JSON {created, modified, next_steps} — contract cho AI',
    '--help          trang này',
  ],
  examples: ['pnpm gen:app reports', 'pnpm gen:app invoices --remote', 'pnpm gen:app dashboard --remote --port 4010'],
  refs: [
    'platform/conventions/05-ports.md (FE remote 40xx) · 08-gateway-and-remotes.md (remote registry + map)',
    'docs/adr/0002 (MF) · docs/adr/0009 (ui-kit) — READ-LOCKED pins: nâng cấp react/rspack phải re-spike',
  ],
});

export function parseAndValidate(argv) {
  const { flags, positionals } = parseArgs(argv);
  const name = positionals[0];
  if (!name || flags.help) return { help: true };
  requireValidName(name, 'tên app');
  if (name.startsWith('remote-')) throw new Error(`tên app không nên bắt đầu "remote-" — compose service tự thêm tiền tố remote-`);
  const port = flags.port == null ? null : Number(flags.port);
  if (flags.port != null && (!Number.isInteger(port) || port <= 1024 || port >= 65536)) {
    throw new Error(`--port không hợp lệ: ${flags.port}`);
  }
  return {
    help: false,
    name,
    remote: flags.remote === true,
    port,
    root: flags.root ?? process.cwd(),
    json: flags.json === true,
  };
}

/** Port dev SPA — quét scripts.dev `--port N` của app/* có sẵn. */
export function usedSpaDevPorts(root) {
  const ports = new Set([5173]); // 5173 = admin đang giữ
  const appsDir = path.join(root, 'app');
  if (!isDir(appsDir)) return ports;
  for (const d of fs.readdirSync(appsDir)) {
    const pkgPath = path.join(appsDir, d, 'package.json');
    if (!exists(pkgPath)) continue;
    try {
      const dev = JSON.parse(readText(pkgPath)).scripts?.dev ?? '';
      const m = dev.match(/--port (\d+)/);
      if (m) ports.add(Number(m[1]));
    } catch {
      // package.json lạ — bỏ qua, không chặn generator
    }
  }
  return ports;
}

export function runGenApp(opts) {
  const { name, remote } = opts;
  const root = opts.root;
  const res = new GenResult();
  const composePath = path.join(root, 'platform/docker-compose.yml');
  const nginxPath = path.join(root, 'platform/gateway/nginx/nginx.conf');
  const envPath = path.join(root, 'platform/.env.example');
  const portsDocPath = path.join(root, 'platform/conventions/05-ports.md');

  const dir = remote ? path.join(root, 'app/remotes', name) : path.join(root, 'app', name);
  if (isDir(dir)) throw new Error(`${path.relative(root, dir)} đã tồn tại — idempotent-guard`);

  const ctx = { name, camel: camel(name), pascal: pascal(name), scream: screaming(name), port: opts.port ?? 0, date: new Date().toISOString().slice(0, 10) };
  let files = remote ? appRemoteFiles(ctx) : appSpaFiles(ctx);

  let newCompose = null;
  let newNginx = null;
  let envRes = null;
  let newPortsDoc = null;

  if (remote) {
    for (const p of [composePath, nginxPath, envPath]) {
      if (!exists(p)) throw new Error(`không phải repo boilerplate — thiếu ${path.relative(root, p)} (chạy từ repo root hoặc --root)`);
    }
    const composeText = readText(composePath);
    const svcName = `remote-${name}`;
    if (composeHasService(composeText, svcName)) throw new Error(`compose đã có service "${svcName}"`);
    const used = usedHostPorts(composeText);
    if (ctx.port === 0) ctx.port = pickFreePort(used, 4003, 4199);
    else if (used.has(ctx.port)) throw new Error(`port ${ctx.port} đã dùng trong compose — chọn port trống (conventions/05)`);
    files = appRemoteFiles(ctx); // sinh lại với port đã biết (templates dùng port trong nội dung)

    newCompose = insertComposeService(
      composeText,
      svcName,
      {
        build: {
          context: '..',
          dockerfile: `app/remotes/${name}/Dockerfile`,
        },
        ports: ['${REMOTE_' + ctx.scream + '_PORT:-' + ctx.port + '}:' + ctx.port],
        healthcheck: {
          test: ['CMD', 'wget', '-qO-', `http://127.0.0.1:${ctx.port}/remoteEntry.js`],
          interval: '5s',
          timeout: '3s',
          retries: 12,
        },
      },
      ` gen:app --remote ${ctx.date} — MF remote static (conventions/05+08; pattern remote-tasks)`,
    );
    // KHÔNG thêm gateway depends_on — parity remote-tasks/remote-activity (static FE,
    // gateway 502 đến khi tồn tại, conventions/08; healthcheck chỉ cho `compose ps`).

    const nginxText = readText(nginxPath);
    newNginx = insertRemoteMapLine(nginxText, name, ctx.port);
    if (!newNginx) {
      throw new Error(`nginx.conf không có anchor map $remote_up — thêm dòng map /remotes/${name}/ tay theo conventions/08`);
    }

    envRes = appendEnvSection(envPath, {
      header: `gen: remote ${name}`,
      vars: [
        { key: `REMOTE_${ctx.scream}_PORT`, value: String(ctx.port), comment: `port side HOST — container cố định ${ctx.port} (conventions/05)` },
        { key: `REMOTE_${ctx.scream}_URL`, value: `http://remote-${name}:${ctx.port}`, comment: 'URL trong mạng compose (shell MF registry — conventions/08)' },
      ],
    });
    if (exists(portsDocPath)) {
      newPortsDoc = appendPortsTableRow(
        readText(portsDocPath),
        `\`remote ${name}\` (FE)`,
        ctx.port,
        `dev server; gateway \`/remotes/${name}/\``,
      );
    }
  } else {
    if (ctx.port === 0) ctx.port = pickFreePort(usedSpaDevPorts(root), 5174, 5199);
    files = appSpaFiles(ctx);
  }

  // --- GHI ---
  for (const [rel, content] of Object.entries(files)) {
    res.createdFile(path.relative(root, writeNew(path.join(dir, rel), content)));
  }
  if (remote) {
    writeText(composePath, newCompose);
    res.modifiedFile('platform/docker-compose.yml');
    writeText(nginxPath, newNginx.text);
    res.modifiedFile('platform/gateway/nginx/nginx.conf');
    if (newNginx.created) res.next('review: nginx.conf vừa tạo marker GEN:remotes trong map $remote_up — các lần gen sau tự chèn trong vùng đó');
    if (envRes.added.length > 0) res.modifiedFile('platform/.env.example');
    if (newPortsDoc != null) {
      writeText(portsDocPath, newPortsDoc);
      res.modifiedFile('platform/conventions/05-ports.md');
    } else {
      res.next(`edit: platform/conventions/05-ports.md — thêm dòng remote ${name} = ${ctx.port} vào bảng (anchor cũ không tìm thấy)`);
    }
    res.next(
      'run: pnpm install  # cập nhật pnpm-lock.yaml importer app/remotes/' + name + ' — Dockerfile frozen-lockfile cần',
      `verify: pnpm --filter @wakii/remote-${name} test && pnpm --filter @wakii/remote-${name} typecheck`,
      `verify: pnpm --filter @wakii/remote-${name} build  # rspack build PASS (2 entry: index + standalone)`,
      `edit: app/shell — thêm slot remote mới: Route path "/${name}" + RemoteSlot name="${name}" exposedModule="./${ctx.pascal}Page" + NavBar item (registry conventions/08; shell READ-LOCKED phần MF bootstrap — chỉ sửa slot/routes)`,
      `edit: platform/.env.example CORS_DEV_ORIGIN — thêm http://localhost:${ctx.port} nếu FE dev gọi API trực tiếp (conventions/07)`,
      'note: Dockerfile app/remotes/' + name + ' COPY đủ importers — khi repo thêm package mới phải bổ sung tay',
    );
  } else {
    res.next(
      `run: pnpm install  # workspace deps mới (workspace:* + catalog:)`,
      `verify: pnpm --filter ${name} test && pnpm --filter ${name} typecheck`,
      `verify: pnpm --filter ${name} dev  # http://localhost:${ctx.port} — dark toggle + Layout kit`,
      `add: trang mới bằng pnpm gen:feature <tên> --app ${name} (tự chèn route tại marker GEN:routes)`,
    );
  }
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
  emit(runGenApp(opts), { json: opts.json });
} catch (err) {
  emitError(err, { json: argv.includes('--json') });
  process.exit(1);
}
