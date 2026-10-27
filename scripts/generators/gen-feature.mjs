#!/usr/bin/env node
// gen-feature.mjs — `pnpm gen:feature <tên> --app <app>`
// Trong 1 app FE có sẵn: sinh Page (Card+Table khung) + api module (decode error
// envelope) + 1 smoke test, rồi ĐĂNG KÝ route:
//  - app react-router declarative (shell/admin/SPA sinh bởi gen-app): chèn Route
//    tại marker GEN:routes (fallback: trước catch-all path="*") + import Page.
//  - app MF remote (có rspack.config.mjs, không router): chèn exposes entry.
// Không chắc anchor → sinh files + đưa next_steps hướng dẫn chèn tay (không đoán).
// Output contract: --json → {created, modified, next_steps} (lib/result.mjs).
import path from 'node:path';
import { appendImport, insertAppRoute, insertRspackExpose } from './lib/docinsert.mjs';
import { exists, isDir, readText, writeNew, writeText } from './lib/io.mjs';
import { camel, parseArgs, pascal, requireValidName } from './lib/naming.mjs';
import { emit, emitError, helpText, GenResult } from './lib/result.mjs';
import { featureFiles } from './tpl/feature.mjs';

const HELP = helpText({
  usage: 'usage: pnpm gen:feature <tên> --app <app> [--root <dir>] [--json] [--help]',
  summary:
    'Thêm 1 feature vào app FE có sẵn: Page + api module + smoke test + đăng ký route/expose.' +
    ' --app nhận tên thư mục dưới app/ (shell, admin, remotes/tasks, app mới sinh bởi gen-app) hoặc path tương đối.',
  flags: [
    '<tên>          tên feature/route kebab-case, vd invoices (bắt buộc, positional đầu)',
    '--app <app>    app đích (bắt buộc): "shell" | "admin" | "remotes/tasks" | path',
    '--root <dir>   repo root (default: cwd)',
    '--json         output JSON {created, modified, next_steps} — contract cho AI',
    '--help         trang này',
  ],
  examples: ['pnpm gen:feature invoices --app admin', 'pnpm gen:feature reports --app shell', 'pnpm gen:feature summary --app remotes/tasks'],
  refs: ['docs/adr/0002 (MF) · platform/conventions/04-error-envelope.md (FE decode qua helper — api module sinh sẵn theo shape)'],
});

export function parseAndValidate(argv) {
  const { flags, positionals } = parseArgs(argv);
  if (flags.help) return { help: true };
  const name = positionals[0];
  if (!name) return { help: true };
  if (!flags.app) throw new Error('thiếu --app <app> — ví dụ: pnpm gen:feature invoices --app admin');
  requireValidName(name, 'tên feature');
  return { help: false, name, app: String(flags.app), root: flags.root ?? process.cwd(), json: flags.json === true };
}

export function runGenFeature(opts) {
  const { name, app } = opts;
  const root = opts.root;
  const res = new GenResult();

  // resolve app dir: app/<v> ưu tiên, fallback path như gõ
  let appDir = path.join(root, 'app', app);
  if (!isDir(appDir)) {
    appDir = path.isAbsolute(app) ? app : path.join(root, app);
  }
  if (!isDir(appDir) || !exists(path.join(appDir, 'package.json'))) {
    throw new Error(`không tìm thấy app "${app}" (${path.relative(root, appDir)} cần có package.json) — --app nhận tên dưới app/ hoặc path`);
  }

  const isRemote = exists(path.join(appDir, 'rspack.config.mjs'));
  const routerPath = path.join(appDir, 'src/App.tsx');
  if (!isRemote && !exists(routerPath)) {
    throw new Error(`app không có src/App.tsx và không có rspack.config.mjs — không xác định được kiểu đăng ký route`);
  }

  const componentName = pascal(name) + 'Page';
  const ctx = {
    name,
    camel: camel(name),
    pascal: componentName,
    kind: isRemote ? 'remote' : 'spa',
    date: new Date().toISOString().slice(0, 10),
  };

  // guards: Page/api/test chưa tồn tại; route chưa có
  for (const rel of [`src/pages/${componentName}.tsx`, `src/api/${name}.ts`, `src/pages/${componentName}.test.tsx`]) {
    if (exists(path.join(appDir, rel))) throw new Error(`${path.relative(root, path.join(appDir, rel))} đã tồn tại — idempotent-guard`);
  }
  const routePath = '/' + name;
  let routerText = null;
  if (!isRemote) {
    routerText = readText(routerPath);
    if (routerText.includes(`path="${routePath}"`)) throw new Error(`route "${routePath}" đã tồn tại trong src/App.tsx`);
  }

  // --- files feature ---
  for (const [rel, content] of Object.entries(featureFiles(ctx))) {
    res.createdFile(path.relative(root, writeNew(path.join(appDir, rel), content)));
  }

  // --- đăng ký route/expose ---
  if (isRemote) {
    const cfgPath = path.join(appDir, 'rspack.config.mjs');
    const cfgText = readText(cfgPath);
    const exposedModule = './' + componentName;
    const next = insertRspackExpose(cfgText, { exposedModule, file: `./src/${componentName}.tsx` });
    if (next != null) {
      writeText(cfgPath, next);
      res.modifiedFile(path.relative(root, cfgPath));
      res.next(
        `edit: expose mới '${exposedModule}' đã chèn — nếu page cần data riêng, thêm async boundary/proxy theo pattern app/remotes/tasks`,
        `edit: app/shell — slot remote: Route path "${routePath}" + RemoteSlot (remote name + exposedModule '${exposedModule}') + NavBar item (conventions/08)`,
      );
    } else {
      res.next(`edit: ${path.relative(root, cfgPath)} — thêm exposes '${exposedModule}': './src/${componentName}.tsx' (anchor exposes: { không tìm thấy)`);
    }
  } else {
    // import style: file dùng .js suffix (admin) hay không (shell)?
    const suffix = /\.js'/.test(routerText) ? '.js' : '';
    const importLine = `import { ${componentName} } from './pages/${componentName}${suffix}';`;
    const next = insertAppRoute(routerText, { routePath, componentName, importLine });
    if (next != null) {
      writeText(routerPath, next);
      res.modifiedFile(path.relative(root, routerPath));
      res.next(
        `verify: pnpm --filter <pkg-của-app> test  # route + Page mount được`,
        `edit: menu/nav của app — thêm item dẫn ${routePath} (SPA: marker GEN:menu trong layout; shell: NavBar)`,
      );
    } else {
      res.next(
        `edit: ${path.relative(root, routerPath)} — thêm import ${importLine}`,
        `edit: ${path.relative(root, routerPath)} — thêm <Route path="${routePath}" element={<${componentName} />} /> trước catch-all`,
      );
    }
  }
  res.next(`read: ${path.relative(root, path.join(appDir, 'FEATURE.md'))} — việc tiếp theo của feature`);
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
  emit(runGenFeature(opts), { json: opts.json });
} catch (err) {
  emitError(err, { json: argv.includes('--json') });
  process.exit(1);
}
