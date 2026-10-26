#!/usr/bin/env node
// create-wakii-app — CLI scaffold app React + @wakii/ui-kit (spec starter-spec).
// Flow: parse flags → prompt phần thiếu (@clack) → confirm → scaffold → next-steps.
// Engine logic nằm ở options.ts/scaffold.ts (test được) — file này chỉ wire UI.
import * as p from '@clack/prompts';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { EXTRAS, PRESETS, parseArgs, resolveOptions, type Preset, type ScaffoldPlan } from './options.js';
import { scaffold } from './scaffold.js';

const USAGE = `create-wakii-app — scaffold app React + @wakii/ui-kit

Usage: pnpm create wakii-app [appName] [flags]

Flags:
  --preset <tên>      demo | minimal | product | admin (default: demo)
  --lang ts|js        Ngôn ngữ (default: ts — preset khác demo chỉ hỗ trợ ts)
  --router/--no-router  react-router v7, preset demo (default: có)
  --extras <list>     Extras phẩy ngăn cách: chart,carousel,schedule,editor —
                      chỉ dành cho preset demo
  --yes               Lấy toàn bộ default, không prompt
  --skip-install      Bỏ gợi ý 'pnpm install' ở next-steps
  -h, --help          In hướng dẫn

Presets:
  demo      Trang demo dogfooding @wakii/ui-kit + router + extras (mặc định)
  minimal   Cấu trúc chuẩn, trang trắng — không data layer
  product   Chuẩn cấu trúc + TanStack Query + zod + MSW + feature tasks mẫu
  admin     product + layout admin (Sidebar + Menu + dashboard + login)

Ví dụ:
  pnpm create wakii-app my-app
  pnpm create wakii-app my-app --preset product
  pnpm create wakii-app admin-app --preset admin --yes
  pnpm create wakii-app my-app --lang ts --router --extras chart,carousel
`;

const PRESET_PROMPTS: Record<Preset, string> = {
  demo: 'demo — trang demo kit + router + extras (mặc định)',
  minimal: 'minimal — cấu trúc chuẩn, trang trắng, không data layer',
  product: 'product — chuẩn cấu trúc + TanStack Query + zod + MSW + feature mẫu',
  admin: 'admin — product + layout admin (Sidebar + dashboard + login)',
};

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
  // Preset hỏi TRƯỚC (định hình các prompt sau: non-demo luôn có router, bỏ extras)
  if (options.preset === undefined && !options.yes) {
    const preset = await p.select<Preset>({
      message: 'Chọn preset?',
      initialValue: 'demo',
      options: PRESETS.map((value) => ({ value, label: PRESET_PROMPTS[value] })),
    });
    if (p.isCancel(preset)) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
    options = { ...options, preset };
  }
  // Router/extras chỉ là lựa chọn của preset demo — non-demo template đóng gói sẵn.
  const presetIsDemo = (options.preset ?? 'demo') === 'demo';
  if (presetIsDemo && options.router === undefined && options.extras.length === 0 && !options.yes) {
    const withRouter = await p.confirm({ message: 'Thêm react-router v7?', initialValue: true });
    if (p.isCancel(withRouter)) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
    options = { ...options, router: withRouter };
  }
  if (presetIsDemo && !options.yes && !options.extrasProvided) {
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
