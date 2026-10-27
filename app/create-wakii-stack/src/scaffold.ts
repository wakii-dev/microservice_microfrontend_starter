// scaffold — full-copy template → render placeholders (__STACK_NAME__/
// __STACK_ORG__ — text files only, binary byte 0x00 bỏ qua) → PRUNE theo
// manifest: xoá paths, prune khối compose theo indentation (block 2-space,
// depends_on entry 6-space), dọn depends_on tham chiếu service đã bỏ, bỏ
// volume pgdata khi postgres bỏ, lọc gateway conf theo marker, lọc .env theo
// envKeys — cuối cùng sinh README.md (services + up + smoke + ports).
// Toàn bộ thao tác compose/gateway/env là TEXT theo cấu trúc thụt dòng —
// không YAML parser (0 deps).
import { spawnSync } from 'node:child_process';
import { chmod, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument, type YAMLMap } from 'yaml';
import type { StackManifest } from './manifest.js';
import type { StackSelection } from './options.js';

/** Template mặc định — publish kèm CLI (worker-compose sở hữu nội dung). */
export const DEFAULT_TEMPLATE_ROOT = (() => {
  // 2 layout (y create-wakii-app): repo app/create-wakii-stack/{src,dist} →
  // app/stack-template; npm <pkg>/dist → <pkg>/stack-template (publish bundle).
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [resolve(here, '../../stack-template'), resolve(here, '../stack-template')]) {
    if (existsSync(candidate)) return candidate;
  }
  return resolve(here, '../../stack-template');
})();

export interface StackScaffoldInput {
  selection: StackSelection;
  dest: string;
  /** Ghi đè nguồn template + manifest (test trỏ fixture). */
  templateRoot?: string;
  /** Đồng bộ pnpm-lock.yaml sau khi rewrite FE deps sang registry (pnpm install
   *  --lockfile-only trong dest; không có pnpm → bỏ --frozen-lockfile Dockerfile).
   *  Mặc định FALSE (test KHÔNG network/spawn) — CLI bật true. */
  lockfileSync?: boolean;
  log?: (message: string) => void;
}

export interface StackScaffoldResult {
  files: string[];
  prunedServices: string[];
}

const STACK_ORG = 'wakii';

async function copyTree(srcDir: string, destDir: string, opts: { stackName: string; files: string[] }): Promise<void> {
  await mkdir(destDir, { recursive: true });
  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    // node_modules: dev-machine artifact lọt vào snapshot qua workspace root install
    // (app/* glob bắt cả stack-template) — KHÔNG phải template; symlink trỏ dir làm
    // readFile EISDIR (bắt khi smoke 2026-10-27)
    if (entry.name === '.DS_Store' || entry.name === 'node_modules' || entry.isSymbolicLink()) continue;
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyTree(srcPath, destPath, opts);
      continue;
    }
    const buffer = await readFile(srcPath);
    if (buffer.includes(0)) {
      await writeFile(destPath, buffer); // binary — nguyên bản
    } else {
      const text = buffer.toString('utf8').replaceAll('__STACK_NAME__', opts.stackName).replaceAll('__STACK_ORG__', STACK_ORG);
      await writeFile(destPath, text);
    }
    opts.files.push(destPath);
  }
}

/** Line category — phân luồng YAML 2-space của compose. */
type LineKind = 'top-level' | 'service-block' | 'comment-2space' | 'deeper' | 'blank';

function kindOf(line: string): LineKind {
  if (line.trim() === '') return 'blank';
  if (!line.startsWith(' ')) return 'top-level';
  if (/^  [A-Za-z0-9_-]+:\s*$/.test(line)) return 'service-block';
  if (/^ {2}#/.test(line)) return 'comment-2space';
  return 'deeper';
}

/**
 * Prune file compose theo TEXT (thuần hàm — state trong closure):
 * - bỏ block 2-space `  <name>:` của service không chọn (kèm comment/blank
 *   thuộc block — comment 2-space gắn block TRƯỚC nó);
 * - dọn `depends_on`: bỏ entry 6-space tham chiếu service đã prune (+ con sâu
 *   hơn); depends_on rỗng hoàn toàn → xoá luôn dòng;
 * - bỏ volume `  pgdata:` khi postgres prune;
 * - chèn 1 comment cảnh báo ngay sau `services:` liệt kê service đã cắt.
 */
export function pruneCompose(text: string, selected: ReadonlySet<string>, allServices: string[]): string {
  // YAML-aware (pkg `yaml` giữ comments): text-prune từng dòng từng phá cấu trúc
  // depends_on mapping-form (gate 2026-10-25: "retries must be a mapping" —
  // entry cắt mồ côi con condition/retries).
  const doc = parseDocument(text);
  const pruned = allServices.filter((name) => !selected.has(name));
  if (pruned.length === 0) return text;

  const services = doc.get('services') as YAMLMap | undefined;
  if (services) {
    for (const name of pruned) services.delete(name);
    // depends_on trong services còn lại: bỏ tham chiếu service đã prune (cả
    // mapping-form {name: {condition…}} lẫn list-form [name, …]); rỗng → xoá key.
    for (const item of services.items) {
      const svcName = String((item.key as { value?: unknown } | null)?.value ?? '');
      const depends = doc.getIn(['services', svcName, 'depends_on'], true);
      if (!depends || typeof depends !== 'object') continue;
      if ((depends as YAMLMap).items) {
        const asMap = depends as YAMLMap;
        let removed = false;
        for (const dep of [...asMap.items]) {
          const depName = String((dep.key as { value?: unknown } | null)?.value ?? '');
          if (pruned.includes(depName)) { asMap.delete(depName); removed = true; }
        }
        if (asMap.items.length === 0) {
          const svcMap = doc.getIn(['services', svcName], true) as YAMLMap;
          svcMap.delete('depends_on');
        } else if (removed) {
          doc.setIn(['services', svcName, 'depends_on'], asMap);
        }
      }
    }
  }

  // pgdata volume chỉ thuộc postgres — bỏ khi postgres bị prune
  if (allServices.includes('postgres') && !selected.has('postgres')) {
    const volumes = doc.get('volumes') as YAMLMap | undefined;
    volumes?.delete('pgdata');
  }

  let out = doc.toString({ lineWidth: 0 });
  // chú thích prune đỉnh services
  out = out.replace(/^services:\n/, `services:\n  # create-wakii-stack: pruned ${pruned.join(', ')} (không chọn khi scaffold)\n`);
  return out;
}

/** Lọc gateway conf: xoá khối ngoặc chứa marker (brace-count từ dòng mở). */
export function pruneGatewayConf(text: string, markers: string[]): string {
  let lines = text.split('\n');
  for (const marker of markers) {
    const result: string[] = [];
    let skipping = false;
    let depth = 0;
    for (const line of lines) {
      if (!skipping && line.includes(marker)) {
        // mở khối: đếm brace trên chính dòng mở
        skipping = true;
        depth = (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0);
        if (depth <= 0) skipping = false; // khối 1 dòng
        continue;
      }
      if (skipping) {
        depth += (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0);
        if (depth <= 0) skipping = false;
        continue;
      }
      result.push(line);
    }
    lines = result;
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Lọc file env: bỏ dòng có key (KEY=…) thuộc danh sách bỏ. */
export function pruneEnv(text: string, keys: string[]): string {
  const keySet = new Set(keys);
  return text
    .split('\n')
    .filter((line) => {
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line);
      return !match || !keySet.has(match[1]!);
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/** README.md sinh ở đỉnh dest — services chọn + up + smoke + ports.
 *
 * Section "Truy cập" là bắt buộc: gateway là entry DUY NHẤT (FE gọi /api
 * same-origin). Mở port FE trực tiếp → static server → POST /api/* trả 405 —
 * lỗi thật gặp trên stack Desktop 2026-10-23 (login "Unexpected error (HTTP 405)").
 */
export function renderReadme(manifest: StackManifest, selection: StackSelection): string {
  const gatewayUrl = manifest.ports?.gateway ?? 'http://localhost:8080';
  const chosen = new Set(selection.services);
  const ports = Object.entries(manifest.ports ?? {})
    .filter(([name]) => chosen.has(name))
    .map(([name, url]) => {
      const note =
        name === 'gateway'
          ? ' — entry duy nhất: `/` = FE shell, `/api/*` = services'
          : name === 'shell'
            ? ' — static-only (login ở đây báo 405 — dùng gateway)'
            : '';
      return `- ${name}: ${url}${note}`;
    })
    .join('\n');
  const access = chosen.has('gateway')
    ? `## Truy cập (sau khi up)

Mở **${gatewayUrl}** (gateway) — entry duy nhất: \`/\` là FE shell, \`/api/*\` là các service.

- Tài khoản demo seeded sẵn: **alice@demo.local / demo-password** (roles admin) · \`fail@demo.local\` — user fixture saga (gán task cho user này xem saga). Hoặc tab **Đăng ký** tạo tài khoản riêng.
- KHÔNG mở port FE trực tiếp (vd \`:3000\`): đó là static server, mọi \`POST /api/*\` trả **405**.

`
    : '';
  return `# ${selection.appName}

Stack generated by \`create-wakii-stack\` (Hybrid C — full template pruned to your selection).

## Services

${selection.services.map((s) => `- ${s} _(${manifest.services[s]?.layer ?? '?'})_`).join('\n')}

${access}## Run

\`\`\`bash
cd ${selection.appName}
cp platform/.env.example platform/.env   # điền secret trước khi up
docker compose -f platform/docker-compose.yml --env-file platform/.env up -d
\`\`\`

${manifest.smoke ? `## Smoke\n\n\`\`\`bash\n${manifest.smoke}\n\`\`\`\n` : ''}
${ports ? `## Ports\n\n${ports}\n` : ''}
## Packages

- FE apps cài **\`@wakii/ui-kit\`** từ npm registry (dist-tag \`latest\` — source không kèm trong stack; nâng cấp bằng \`pnpm update @wakii/ui-kit\`).
- \`@wakii/fe-shared\` vẫn consumed qua source \`app/shared\` (workspace — không qua npm).

Need a FE app (SPA) outside this stack? \`pnpm create wakii-app\`.
`;
}

/** Tìm đệ quy mọi file theo tên (Dockerfile) — dest chưa install nên an toàn. */
async function collectByName(root: string, name: string, out: string[] = []): Promise<string[]> {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.name === '.DS_Store' || entry.name === '.git') continue;
    const p = join(root, entry.name);
    if (entry.isDirectory()) await collectByName(p, name, out);
    else if (entry.name === name) out.push(p);
  }
  return out;
}

/**
 * FE deps chuyển sang npm registry khi scaffold (Hybrid C — mọi thứ ở ENGINE
 * runtime, template snapshot giữ nguyên). `app/ui-kit` bị prune khỏi source →
 * FE apps cài từ registry. Giá trị = dist-tag `latest` (coordinator 2026-10-27):
 * cài bản mới nhất trên npm tại thời điểm scaffold — lockfile ghim version đó,
 * nâng cấp trong repo sinh ra bằng `pnpm update @wakii/ui-kit`.
 * `@wakii/fe-shared` CỐ Ý KHÔNG nằm đây — `app/shared` giữ nguyên trong scaffold
 * (consumed qua source, workspace:*) theo điều chỉnh coordinator 2026-10-27.
 */
const REGISTRY_DEPS: Record<string, string> = { '@wakii/ui-kit': 'latest' };

/**
 * Rewrite `"@wakii/ui-kit": "workspace:*"` → giá trị registry trong package.json
 * các FE app (mọi dir con trực tiếp của `app/` + `app/remotes/<name>` — dep khai
 * ở ROOT package, import subpath `@wakii/ui-kit/carousel` không cần key riêng).
 * Chỉ đụng key có giá trị đúng `workspace:*` — khai khác (file:/...) giữ nguyên.
 * Trả số package.json đã sửa.
 */
export async function rewriteRegistryDeps(dest: string, log?: (message: string) => void): Promise<number> {
  const appDir = join(dest, 'app');
  if (!existsSync(appDir)) return 0;
  const candidates: string[] = [];
  for (const entry of await readdir(appDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'remotes') {
      for (const remote of await readdir(join(appDir, 'remotes'), { withFileTypes: true })) {
        if (remote.isDirectory()) candidates.push(join(appDir, 'remotes', remote.name));
      }
    } else {
      candidates.push(join(appDir, entry.name));
    }
  }

  let changed = 0;
  for (const dir of candidates) {
    const pkgPath = join(dir, 'package.json');
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, Record<string, string>>;
    let touched = false;
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      const deps = pkg[section];
      if (!deps) continue;
      for (const [name, range] of Object.entries(REGISTRY_DEPS)) {
        if (deps[name] === 'workspace:*') {
          deps[name] = range;
          touched = true;
        }
      }
    }
    if (touched) {
      await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
      changed += 1;
      log?.(`Registry deps: ${pkgPath.slice(dest.length + 1)} (workspace:* → latest)`);
    }
  }
  return changed;
}

/**
 * rspack swc-loader include liệt kê source FE qua regex
 * `/[\\/]app[\\/](shared|ui-kit)[\\/]src/` — sau khi prune app/ui-kit, source đó
 * không còn → thu pattern về shared (đơn giản hoá theo brief: "làm nếu đơn giản" —
 * text replace literal, không eval). Đơn vị chỉ chạy khi app/ui-kit bị prune.
 */
export async function rewriteRspackIncludes(dest: string, log?: (message: string) => void): Promise<number> {
  const SEARCH = '/[\\\\/]app[\\\\/](shared|ui-kit)[\\\\/]src/';
  const REPLACE = '/[\\\\/]app[\\\\/]shared[\\\\/]src/';
  const appDir = join(dest, 'app');
  if (!existsSync(appDir)) return 0;
  let files = 0;
  for (const config of await collectByName(appDir, 'rspack.config.mjs')) {
    const src = await readFile(config, 'utf8');
    if (!src.includes(SEARCH)) continue;
    await writeFile(config, src.replaceAll(SEARCH, REPLACE));
    files += 1;
  }
  if (files > 0) log?.(`Rewrite ${files} rspack include (bỏ pattern ui-kit source)`);
  return files;
}

/**
 * Đồng bộ pnpm-lock.yaml sau khi rewrite deps — nếu không, `docker build` gãy ở
 * `pnpm install --frozen-lockfile` (lock còn specifier workspace:* / version link).
 * Ưu tiên `pnpm install --lockfile-only` trong dest (resolution-only, KHÔNG tạo
 * node_modules, KHÔNG chạy scripts); pnpm không có/fail → fallback xoá cờ
 * --frozen-lockfile khỏi Dockerfile (container tự resolve range mới khi build).
 */
export type LockfileSyncMode = 'pnpm' | 'unfrozen' | 'skipped';

export async function syncLockfile(dest: string, log?: (message: string) => void): Promise<LockfileSyncMode> {
  if (!existsSync(join(dest, 'pnpm-lock.yaml'))) return 'skipped';
  const probe = spawnSync('pnpm', ['--version'], { cwd: dest, encoding: 'utf8', timeout: 15_000 });
  if (probe.status === 0) {
    const install = spawnSync('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], {
      cwd: dest,
      encoding: 'utf8',
      timeout: 180_000,
    });
    if (install.status === 0) {
      log?.('Lockfile tái sinh (pnpm install --lockfile-only) — frozen-lockfile giữ nguyên');
      return 'pnpm';
    }
    log?.(`pnpm install --lockfile-only thất bại — fallback bỏ --frozen-lockfile`);
  } else {
    log?.('pnpm không có trên PATH — fallback bỏ --frozen-lockfile');
  }
  await unfreezeDockerfiles(dest);
  log?.('Đã bỏ --frozen-lockfile khỏi Dockerfile (lock cũ không khớp range registry mới)');
  return 'unfrozen';
}

/** Xoá cờ --frozen-lockfile khỏi mọi Dockerfile trong dest. Test riêng vì nhánh
 *  còn lại của syncLockfile cần pnpm thật (chỉ chạy trong smoke). */
export async function unfreezeDockerfiles(dest: string): Promise<number> {
  let files = 0;
  for (const dockerfile of await collectByName(dest, 'Dockerfile')) {
    const src = await readFile(dockerfile, 'utf8');
    if (!src.includes('--frozen-lockfile')) continue;
    await writeFile(dockerfile, src.replaceAll(' --frozen-lockfile', ''));
    files += 1;
  }
  return files;
}

/**
 * Dọn references workspace sau khi prune dir — docker build FROM-SCRATCH gãy nếu
 * thiếu 1 trong 3 (bắt trên stack Desktop 0.1.4, 2026-10-23):
 * 1. Dockerfile `COPY app/spike/...` còn trỏ dir đã xoá → COPY fail ("failed to
 *    compute cache key").
 * 2. pnpm-lock.yaml còn importer dir đã xoá → `pnpm install --frozen-lockfile`
 *    mismatch (lock có importer, workspace không có).
 * 3. pnpm-workspace.yaml còn glob riêng trỏ dir đã xoá (`app/spike/*`).
 */
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function pruneWorkspaceRefs(
  dest: string,
  prunedPaths: string[],
  log?: (message: string) => void,
): Promise<void> {
  if (prunedPaths.length === 0) return;
  const isPrunedCopy = (line: string) =>
    prunedPaths.some((p) => line.startsWith(`COPY ${p}/`) || line === `COPY ${p}` || line.startsWith(`COPY ${p} `));

  // 1. Dockerfile — bỏ dòng COPY trỏ dir đã prune
  let dockerLines = 0;
  for (const dockerfile of await collectByName(dest, 'Dockerfile')) {
    const lines = (await readFile(dockerfile, 'utf8')).split('\n');
    const kept = lines.filter((line) => !isPrunedCopy(line));
    if (kept.length !== lines.length) {
      await writeFile(dockerfile, kept.join('\n'));
      dockerLines += lines.length - kept.length;
    }
  }
  if (dockerLines > 0) log?.(`Pruned ${dockerLines} dòng COPY Dockerfile`);

  // 2. pnpm-lock.yaml — strip importer key "  <path>:" (khối con thụt 4-space,
  // dừng ở key 2-space kế / EOF). Chỉ strip khi key thật sự tồn tại.
  const lockPath = join(dest, 'pnpm-lock.yaml');
  if (existsSync(lockPath)) {
    let lock = await readFile(lockPath, 'utf8');
    let stripped = 0;
    for (const p of prunedPaths) {
      // importer = chính dir đó HOẶC con của nó (app/spike → app/spike/host)
      const pattern = new RegExp(`^  (?:${escapeRegex(p)}(?:/[^:\\n]+)?):\\n(?:    .*\\n|\\n)*?(?=^  \\S|\\S|$)`, 'gm');
      const before = lock;
      lock = lock.replace(pattern, '');
      if (lock !== before) stripped += 1;
    }
    if (stripped > 0) {
      await writeFile(lockPath, lock);
      log?.(`Pruned ${stripped} pnpm-lock importer`);
    }
  }

  // 3. pnpm-workspace.yaml — bỏ glob riêng trỏ dir đã prune (+ comment liền trên)
  const wsPath = join(dest, 'pnpm-workspace.yaml');
  if (existsSync(wsPath)) {
    const lines = (await readFile(wsPath, 'utf8')).split('\n');
    const kept: string[] = [];
    let globs = 0;
    for (const line of lines) {
      const isGlob = prunedPaths.some((p) => new RegExp(`^\\s*-\\s*["']${escapeRegex(p)}/\\*["']\\s*$`).test(line));
      if (isGlob) {
        globs += 1;
        const prev = kept[kept.length - 1];
        if (prev !== undefined && /^\s*#/.test(prev)) kept.pop(); // comment mồ côi của glob
        continue;
      }
      kept.push(line);
    }
    if (globs > 0) {
      await writeFile(wsPath, kept.join('\n'));
      log?.(`Pruned ${globs} pnpm-workspace glob`);
    }
  }

  // 4. rspack swc-loader include pattern — app/ui-kit prune → thu về shared
  if (prunedPaths.includes('app/ui-kit')) {
    await rewriteRspackIncludes(dest, log);
  }
}

/** Scaffold 1 stack: full-copy → render → prune theo manifest → README. */
export async function scaffold(input: StackScaffoldInput): Promise<StackScaffoldResult> {
  const { selection, dest, log } = input;
  const templateRoot = input.templateRoot ?? DEFAULT_TEMPLATE_ROOT;
  const manifestPath = join(templateRoot, 'stack-manifest.json');
  if (!existsSync(manifestPath)) throw new Error(`Không thấy stack-manifest.json tại ${templateRoot}`);
  const { loadManifest } = await import('./manifest.js');
  const manifest = loadManifest(manifestPath);

  const files: string[] = [];
  log?.(`Copy full template → ${dest}`);
  await copyTree(templateRoot, dest, { stackName: selection.appName, files });

  const allServices = Object.keys(manifest.services);
  const pruned = allServices.filter((s) => !selection.services.includes(s));

  // 0. LUÔN xoá tooling meta của hệ sinh thái Wakii — snapshot cả repo nhưng
  // các package này không thuộc stack được sinh ra (CLI scaffolders + templates
  // nguồn + spike thử nghiệm) + app/ui-kit: FE cài từ npm registry thay nhúng
  // source (2026-10-27 — rewriteRegistryDeps đổi workspace:* → latest).
  // LƯU Ý: app/shared KHÔNG prune — fe-shared consumed qua source (workspace:*).
  const ALWAYS_PRUNE = ['app/create-wakii-app', 'app/create-wakii-stack', 'app/starter-templates', 'app/stack-template', 'app/spike', 'app/ui-kit'];
  const prunedPaths: string[] = [];
  for (const relPath of ALWAYS_PRUNE) {
    const target = join(dest, relPath);
    if (existsSync(target)) {
      await rm(target, { recursive: true, force: true });
      prunedPaths.push(relPath);
      log?.(`Pruned tooling: ${relPath}`);
    }
  }

  // 1. xoá paths của service bị prune
  for (const name of pruned) {
    for (const rawPath of manifest.services[name]!.paths ?? []) {
      // glob "dir/**" (manifest M#8) → xoá cả base dir; đường dẫn thường giữ nguyên
      const relPath = rawPath.endsWith('/**') ? rawPath.slice(0, -3) : rawPath;
      const target = join(dest, relPath);
      if (existsSync(target)) {
        await rm(target, { recursive: true, force: true });
        prunedPaths.push(relPath);
        log?.(`Pruned path: ${relPath}`);
      }
    }
  }

  // 2. prune compose (block + depends_on + pgdata + warning comment)
  const composePath = join(dest, manifest.files.compose);
  if (existsSync(composePath) && pruned.length > 0) {
    const before = await readFile(composePath, 'utf8');
    await writeFile(composePath, pruneCompose(before, new Set(selection.services), allServices));
    log?.(`Pruned compose: -${pruned.join(', -')}`);
  }

  // 3. prune gateway conf theo gatewayBlocks của service bị prune
  if (manifest.files.gatewayConf) {
    const gatewayPath = join(dest, manifest.files.gatewayConf);
    const markers = pruned.flatMap((name) => manifest.services[name]!.gatewayBlocks ?? []);
    if (existsSync(gatewayPath) && markers.length > 0) {
      const before = await readFile(gatewayPath, 'utf8');
      await writeFile(gatewayPath, pruneGatewayConf(before, markers));
      log?.(`Pruned gateway blocks: ${markers.length}`);
    }
  }

  // 4. lọc env keys
  if (manifest.files.env) {
    const envPath = join(dest, manifest.files.env);
    const keys = pruned.flatMap((name) => manifest.services[name]!.envKeys ?? []);
    if (existsSync(envPath) && keys.length > 0) {
      const before = await readFile(envPath, 'utf8');
      await writeFile(envPath, pruneEnv(before, keys));
      log?.(`Pruned env keys: ${keys.length}`);
    }
  }

  // 4b. dọn references workspace (Dockerfile COPY / pnpm-lock importers /
  // pnpm-workspace globs / rspack include pattern) của mọi dir đã prune —
  // docker build from-scratch gãy nếu thiếu (bắt trên stack Desktop 0.1.4)
  await pruneWorkspaceRefs(dest, prunedPaths, log);

  // 4c. FE deps → npm registry (app/ui-kit đã prune ở bước 0): rewrite
  // workspace:* → latest rồi đồng bộ lockfile (pnpm lockfile-only; không có
  // pnpm → unfreeze Dockerfile). @wakii/fe-shared giữ workspace — app/shared
  // ở lại source (điều chỉnh coordinator 2026-10-27).
  const registryRewritten = await rewriteRegistryDeps(dest, log);
  if (registryRewritten > 0 && input.lockfileSync) {
    await syncLockfile(dest, log);
  }

  // 5. README sinh ở đỉnh dest
  await writeFile(join(dest, 'README.md'), renderReadme(manifest, selection));

  // 6. Phục hồi bit executable — npm tarball (publish bundle) làm MẤT +x mọi
  // file (postgres 01-init.sh "bad interpreter", spring mvnw exit 126 — bắt
  // từ docker compose up thật trên stack sinh ra, 2026-10-25).
  const execFixed = await fixExecutableBits(dest);
  if (execFixed > 0) log?.(`chmod +x: ${execFixed} script`);

  return { files: [...files.map((f) => f.slice(dest.length + 1)), 'README.md'], prunedServices: pruned };
}

/** chmod 0o755 mọi *.sh, mvnw, gradlew trong dest (đệ quy). Trả số file sửa. */
async function fixExecutableBits(root: string): Promise<number> {
  let count = 0;
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) { await walk(full); continue; }
      if (/\.(sh)$/.test(entry.name) || entry.name === 'mvnw' || entry.name === 'gradlew') {
        const st = await stat(full);
        if (!(st.mode & 0o111)) {
          await chmod(full, st.mode | 0o755);
          count += 1;
        }
      }
    }
  };
  await walk(root);
  return count;
}
