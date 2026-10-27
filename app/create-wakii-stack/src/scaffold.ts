// scaffold — full-copy template → render placeholders (__STACK_NAME__/
// __STACK_ORG__ — text files only, binary byte 0x00 bỏ qua) → PRUNE theo
// manifest: xoá paths, prune khối compose theo indentation (block 2-space,
// depends_on entry 6-space), dọn depends_on tham chiếu service đã bỏ, bỏ
// volume pgdata khi postgres bỏ, lọc gateway conf theo marker, lọc .env theo
// envKeys — cuối cùng sinh README.md (services + up + smoke + ports).
// Toàn bộ thao tác compose/gateway/env là TEXT theo cấu trúc thụt dòng —
// không YAML parser (0 deps).
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
    if (entry.name === '.DS_Store') continue;
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
docker compose --env-file platform/.env up -d
\`\`\`

${manifest.smoke ? `## Smoke\n\n\`\`\`bash\n${manifest.smoke}\n\`\`\`\n` : ''}
${ports ? `## Ports\n\n${ports}\n` : ''}
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
  // nguồn + spike thử nghiệm).
  const ALWAYS_PRUNE = ['app/create-wakii-app', 'app/create-wakii-stack', 'app/starter-templates', 'app/stack-template', 'app/spike'];
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
  // pnpm-workspace globs) của mọi dir đã prune — docker build from-scratch gãy
  // nếu thiếu (bắt trên stack Desktop 0.1.4)
  await pruneWorkspaceRefs(dest, prunedPaths, log);

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
