#!/usr/bin/env node
// create-wakii-app — CLI scaffold app React + @wakii/ui-kit (spec starter-spec).
// Flow: parse flags → prompt phần thiếu (@clack) → confirm → scaffold → next-steps.
// Engine logic nằm ở options.ts/scaffold.ts (test được) — file này chỉ wire UI.
import * as p from '@clack/prompts';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { EXTRAS, parseArgs, resolveOptions, type ScaffoldPlan } from './options.js';
import { scaffold } from './scaffold.js';

const USAGE = `create-wakii-app — scaffold app React + @wakii/ui-kit

Usage: pnpm create wakii-app [appName] [flags]

Flags:
  --lang ts|js        Ngôn ngữ (default: ts)
  --router/--no-router  react-router v7 (default: có)
  --extras <list>     Extras phẩy ngăn cách: chart,carousel,schedule,editor (default: none)
  --yes               Lấy toàn bộ default, không prompt
  --skip-install      Bỏ gợi ý 'pnpm install' ở next-steps
  -h, --help          In hướng dẫn

Ví dụ: pnpm create wakii-app my-app --lang ts --router --extras chart,carousel
`;

function printNextSteps(plan: ScaffoldPlan): void {
  const steps = [`cd ${plan.appName}`];
  if (!plan.skipInstall) steps.push('pnpm install');
  steps.push('pnpm dev');
  p.log.info('Next steps:');
  for (const step of steps) p.log.step(`  ${step}`);
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    p.log.error(parsed.message);
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }
  if (parsed.options.help) {
    console.log(USAGE);
    return;
  }

  p.intro('create-wakii-app — scaffold React + @wakii/ui-kit');

  let options = parsed.options;
  if (options.appName === undefined) {
    const name = await p.text({ message: 'Tên project?', placeholder: 'my-wakii-app', defaultValue: 'my-wakii-app' });
    if (p.isCancel(name)) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
    options = { ...options, appName: name.trim() };
  }
  if (options.router === undefined && options.extras.length === 0 && !options.yes) {
    const withRouter = await p.confirm({ message: 'Thêm react-router v7?', initialValue: true });
    if (p.isCancel(withRouter)) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
    options = { ...options, router: withRouter };
  }
  if (!options.yes && !options.extrasProvided) {
    const chosen = await p.multiselect({
      message: 'Extras (tuỳ chọn — demo subpath component nặng)',
      options: EXTRAS.map((value) => ({ value, label: value })),
      required: false,
    });
    if (p.isCancel(chosen)) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
    options = { ...options, extras: chosen };
  }

  let plan: ReturnType<typeof resolveOptions>;
  try {
    plan = resolveOptions(options);
  } catch (err) {
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }
  // Positional nhận TÊN hoặc ĐƯỜNG DẪN (CRA style): 'my-app' → ./my-app;
  // '/a/b/my-app' → dest /a/b/my-app. Package name luôn lấy basename — path
  // tuyệt đối không lọt vào package.json (bug gate 2026-10-24).
  const nameIsPath = /[\\/]/.test(plan.appName);
  const dest = nameIsPath ? resolve(plan.appName) : resolve(process.cwd(), plan.appName);
  const finalPlan = nameIsPath
    ? { ...plan, appName: dest.split(/[\\/]/).pop() ?? 'my-wakii-app' }
    : plan;
  if (existsSync(dest) && readdirSync(dest).length > 0) {
    p.log.error(`Thư mục đích đã tồn tại và không rỗng: ${dest}`);
    process.exitCode = 1;
    return;
  }

  const s = p.spinner();
  s.start('Scaffolding…');
  try {
    const result = await scaffold({
      plan: finalPlan,
      dest,
      log: (message) => {
        s.message(message);
      },
    });
    s.stop(`Xong — ${result.files.length} file ghi vào ${dest}`);
  } catch (err) {
    s.stop('Scaffold lỗi');
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  p.outro('Sẵn sàng! 🎉');
  // next-steps cd theo ĐÚNG đường dẫn đã tạo (path hoặc ./name)
  printNextSteps(nameIsPath ? { ...finalPlan, appName: dest } : finalPlan);
}

main().catch((err: unknown) => {
  p.log.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
