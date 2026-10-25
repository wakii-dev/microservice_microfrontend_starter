#!/usr/bin/env node
// create-wakii-stack — CLI scaffold full-stack (Hybrid C: full-copy + prune theo
// manifest). Flow: parse flags → prompt multiselect services (default all) →
// confirm → scaffold spinner → next-steps. Engine logic ở options/manifest/scaffold.
import * as p from '@clack/prompts';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs, resolveOptions, type StackSelection } from './options.js';
import { loadManifest } from './manifest.js';
import { scaffold, DEFAULT_TEMPLATE_ROOT } from './scaffold.js';

const USAGE = `create-wakii-stack — scaffold full-stack FE+BE (Hybrid C: full-copy + prune)

Usage: pnpm create wakii-stack [stackName] [flags]

Flags:
  --services <list>  Services phẩy ngăn cách (vd node-svc,spring-svc,shell,tasks,activity,admin)
  --all              Chọn mọi service trong manifest
  --yes              Bỏ confirm summary
  --skip-install     Bỏ gợi ý cài đặt ở next-steps
  -h, --help         In hướng dẫn

Rules tầng 1: ≥1 BE tự kèm postgres+kafka+gateway+auth-svc; ≥1 FE tự kèm gateway.
`;

function printNextSteps(selection: StackSelection, gatewayUrl: string | undefined): void {
  const steps = [
    `cd ${selection.appName}`,
    'cp platform/.env.example platform/.env   # điền secret trước khi up',
    'docker compose --env-file platform/.env up -d',
  ];
  if (!selection.skipInstall) steps.push('# FE apps: pnpm install trong từng app muốn chạy build cục bộ');
  p.log.info('Next steps:');
  for (const step of steps) p.log.step(`  ${step}`);
  const entry = gatewayUrl ?? 'http://localhost:8080';
  p.log.info(`Mở ${entry} (gateway — entry duy nhất: / là FE shell, /api/* là services). Đăng ký tài khoản trước khi login (auth-svc không seed user).`);
  p.log.warn('Port FE trực tiếp (vd :3000) chỉ là static server — login ở đó báo HTTP 405.');
  p.log.info('FE-only SPA ngoài stack? pnpm create wakii-app');
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

  p.intro('create-wakii-stack — scaffold FE+BE stack');

  // Manifest ĐỌC TỪ TEMPLATE (worker-compose sở hữu) — cần trước khi prompt
  // (danh sách service + layer come from manifest, engine không hardcode).
  let manifest;
  try {
    manifest = loadManifest(join(DEFAULT_TEMPLATE_ROOT, 'stack-manifest.json'));
  } catch (err) {
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }
  const allServices = Object.keys(manifest.services);

  let options = parsed.options;
  if (!options.all && options.services === undefined) {
    const chosen = await p.multiselect({
      message: 'Chọn services (space chọn/bo, enter xác nhận)',
      required: true,
      options: allServices.map((name) => ({
        value: name,
        label: `${name} — ${manifest.services[name]!.layer}`,
      })),
    });
    if (p.isCancel(chosen)) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
    options = { ...options, services: chosen };
  }

  if (!options.yes) {
    const preview = resolveOptions(options, {
      validServices: allServices,
      layerOf: (name) => manifest.services[name]?.layer,
      requiresOf: (name) => manifest.services[name]?.requires ?? [],
    });
    const confirmed = await p.confirm({
      message: `Scaffold '${preview.appName}' với ${preview.services.length} services? (${preview.services.join(', ')})`,
      initialValue: true,
    });
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Huỷ — không scaffold gì.');
      return;
    }
  }

  let selection: StackSelection;
  try {
    selection = resolveOptions(options, {
      validServices: allServices,
      layerOf: (name) => manifest.services[name]?.layer,
      requiresOf: (name) => manifest.services[name]?.requires ?? [],
    });
  } catch (err) {
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  // Positional nhận TÊN hoặc ĐƯỜNG DẪN (y create-wakii-app): path → dest đúng
  // vị trí, __STACK_NAME__ render bằng basename (selection.appName đã basename).
  const rawName = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : (selection.appName);
  const dest = /[\\/]/.test(rawName) ? resolve(rawName) : resolve(process.cwd(), rawName);
  if (existsSync(dest) && readdirSync(dest).length > 0) {
    p.log.error(`Thư mục đích đã tồn tại và không rỗng: ${dest}`);
    process.exitCode = 1;
    return;
  }

  const s = p.spinner();
  s.start('Scaffolding stack…');
  try {
    const result = await scaffold({
      selection,
      dest,
      templateRoot: DEFAULT_TEMPLATE_ROOT,
      log: (message) => {
        s.message(message);
      },
    });
    s.stop(`Xong — ${result.files.length} file · pruned: ${result.prunedServices.length} service`);
  } catch (err) {
    s.stop('Scaffold lỗi');
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  p.outro('Stack sẵn sàng! 🎉');
  printNextSteps(selection, manifest.ports?.gateway);
}

main().catch((err: unknown) => {
  p.log.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
