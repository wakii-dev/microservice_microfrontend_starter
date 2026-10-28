#!/usr/bin/env node
// create-wakii-app — CLI scaffold app React + @wakii/ui-kit (spec starter-spec).
// Flow: parse flags → prompt phần thiếu (@clack) → confirm → scaffold → next-steps.
// Engine logic nằm ở options.ts/scaffold.ts (test được) — file này chỉ wire UI.
import * as p from '@clack/prompts';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { EXTRAS, PRESETS, VARIANTS, parseArgs, resolveOptions, type Preset, type ScaffoldPlan, type Variant } from './options.js';
import { scaffold } from './scaffold.js';

const USAGE = `create-wakii-app — scaffold app React + @wakii/ui-kit

Usage: pnpm create wakii-app [appName] [flags]

Flags:
  --preset <tên>      demo | minimal | product | admin | landing (default: demo)
  --variant <tên>     vite | next | astro — framework của preset demo (default: vite)
  --lang ts|js        Ngôn ngữ (default: ts — product/admin chỉ hỗ trợ ts;
                      minimal/landing có bản js riêng)
  --router/--no-router  react-router v7, preset demo (default: có)
  --extras <list>     Extras phẩy ngăn cách: chart,carousel,schedule,editor —
                      chỉ dành cho preset demo
  --yes               Lấy toàn bộ default, không prompt
  --skip-install      Bỏ gợi ý 'pnpm install' ở next-steps
  -h, --help          In hướng dẫn

Presets:
  demo      Trang demo dogfooding @wakii/ui-kit + router + extras (mặc định) —
            chọn framework: vite | next | astro
  minimal   Cấu trúc chuẩn, trang trắng — không data layer
  product   Chuẩn cấu trúc + TanStack Query + zod + MSW + feature tasks mẫu
  admin     product + layout admin (Sidebar + Menu + dashboard + login)
  landing   1 trang landing motion showcase (Reveal/Parallax/CountUp/FAQ) — không router

Ví dụ:
  pnpm create wakii-app my-app
  pnpm create wakii-app my-app --preset product
  pnpm create wakii-app admin-app --preset admin --yes
  pnpm create wakii-app landing-app --preset landing --yes
  pnpm create wakii-app my-app --preset minimal --lang js
  pnpm create wakii-app my-app --variant next
  pnpm create wakii-app my-app --lang ts --router --extras chart,carousel
`;

const PRESET_PROMPTS: Record<Preset, string> = {
  demo: 'demo — trang demo kit + router + extras (mặc định)',
  minimal: 'minimal — cấu trúc chuẩn, trang trắng, không data layer',
  product: 'product — chuẩn cấu trúc + TanStack Query + zod + MSW + feature mẫu',
  admin: 'admin — product + layout admin (Sidebar + dashboard + login)',
  landing: 'landing — 1 trang landing motion showcase (Reveal/Parallax/CountUp/FAQ), không router',
};

/** Hint một dòng cho prompt chọn preset — người mới hiểu ngay từng loại để làm gì. */
const PRESET_HINTS: Record<Preset, string> = {
  demo: 'Showcase kit — đủ 90+ components + extras chart/carousel/…',
  minimal: 'Trang trắng + cấu trúc chuẩn — tự thêm data layer',
  product: 'App thật: TanStack Query + zod + MSW + containers/ui/hooks/api',
  admin: 'Product + Sidebar/Menu + dashboard + login',
  landing: 'Landing motion 1 trang — nhẹ nhất',
};

const VARIANT_PROMPTS: Record<Variant, string> = {
  vite: 'vite — SPA Vite (mặc định, hỗ trợ extras)',
  next: 'next — Next.js App Router',
  astro: 'astro — Astro + React island',
};

function printNextSteps(plan: ScaffoldPlan): void {
  const steps = [`cd ${plan.appName}`];
  if (!plan.skipInstall) steps.push('pnpm install');
  steps.push('pnpm dev');
  p.log.info('Next steps:');
  for (const step of steps) p.log.step(`  ${step}`);
}

// Node guard — engines khai báo >=22 nhưng cảnh báo THẬT lúc chạy (node 18 sẽ
// lỗi mơ hồ ở install vì lockfile v9). Không chặn — chỉ in rõ.
const [nodeMajor] = process.versions.node.split('.').map(Number);
if (nodeMajor < 22) {
  p.log.warn(`Node ${process.versions.node} — template cần Node >= 22 (lockfile pnpm 9). Nên nâng node trước khi install.`);
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
      options: PRESETS.map((value) => ({ value, label: PRESET_PROMPTS[value], hint: PRESET_HINTS[value] })),
    });
    if (p.isCancel(preset)) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
    options = { ...options, preset };
  }
  // Variant hỏi NGAY SAU preset (chỉ demo) — next/astro có trang + routing riêng
  // trong template, overlay router/extras của vite không áp dụng.
  const presetIsDemo = (options.preset ?? 'demo') === 'demo';
  if (presetIsDemo && options.variant === undefined && !options.yes) {
    const variant = await p.select<Variant>({
      message: 'Framework cho demo?',
      initialValue: 'vite',
      options: VARIANTS.map((value) => ({ value, label: VARIANT_PROMPTS[value] })),
    });
    if (p.isCancel(variant)) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
    options = { ...options, variant };
  }
  // Router/extras là overlay demo × vite — chọn next/astro thì bỏ prompt (tránh
  // tạo cấu hình chắc chắn lỗi ở resolveOptions).
  const variantIsVite = (options.variant ?? 'vite') === 'vite';
  if (presetIsDemo && variantIsVite && options.router === undefined && options.extras.length === 0 && !options.yes) {
    const withRouter = await p.confirm({ message: 'Thêm react-router v7?', initialValue: true });
    if (p.isCancel(withRouter)) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
    options = { ...options, router: withRouter };
  }
  if (presetIsDemo && variantIsVite && !options.yes && !options.extrasProvided) {
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
      dryRun: finalPlan.dryRun,
      log: (message) => {
        s.message(message);
      },
    });
    if (finalPlan.dryRun) {
      s.stop(`Dry-run — ${result.files.length} file SẼ được tạo (chưa ghi gì)`);
      for (const f of result.files.slice(0, 30)) p.log.step(`  ${f}`);
      if (result.files.length > 30) p.log.step(`  … và ${result.files.length - 30} file khác`);
    } else {
      s.stop(`Xong — ${result.files.length} file ghi vào ${dest}`);
    }
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
