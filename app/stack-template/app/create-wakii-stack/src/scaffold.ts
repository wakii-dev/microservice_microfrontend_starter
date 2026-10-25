// scaffold — full-copy template → render placeholders (__STACK_NAME__/
// __STACK_ORG__ — text files only, binary byte 0x00 bỏ qua) → PRUNE theo
// manifest: xoá paths, prune khối compose theo indentation (block 2-space,
// depends_on entry 6-space), dọn depends_on tham chiếu service đã bỏ, bỏ
// volume pgdata khi postgres bỏ, lọc gateway conf theo marker, lọc .env theo
// envKeys — cuối cùng sinh README.md (services + up + smoke + ports).
// Toàn bộ thao tác compose/gateway/env là TEXT theo cấu trúc thụt dòng —
// không YAML parser (0 deps).
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StackManifest } from './manifest.js';
import type { StackSelection } from './options.js';

/** Template mặc định — publish kèm CLI (worker-compose sở hữu nội dung). */
export const DEFAULT_TEMPLATE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../stack-template');

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
 * Prune file compose theo TEXT:
 * - bỏ block 2-space `  <name>:` của service không chọn (kèm comment/blank
 *   thuộc block — comment 2-space gắn block TRƯỚC nó);
 * - dọn `depends_on`: bỏ entry 6-space tham chiếu service đã prune (+ con sâu
 *   hơn); depends_on rỗng → xoá luôn dòng;
 * - bỏ volume `  pgdata:` khi postgres prune;
 * - chèn 1 comment cảnh báo đầu section services liệt kê service đã cắt.
 */
export function pruneCompose(text: string, selected: ReadonlySet<string>, allServices: string[]): string {
  const lines = text.split('\n');
  const pruned = allServices.filter((s) => !selected.has(s));
  const out: string[] = [];
  let section = ''; // top-level key hiện tại
  let keptService: string | null = null; // service block đang ghi (null = ngoài block/bị cắt)
  let skippingService: string | null = null; // service block đang cắt
  let inDependsOn = false;
  const prunedInFile: string[] = [];

  for (const line of lines) {
    const kind = kindOf(line);
    if (kind === 'top-level') {
      section = line.replace(/:.*$/, '').trim();
      keptService = null;
      skippingService = null;
      inDependsOn = false;
      out.push(line);
      if (section === 'services' && pruned.length > 0 && !textHasPruneNote(out)) {
        out.push(`  # create-wakii-stack: pruned ${pruned.join(', ')} (không chọn khi scaffold)`);
      }
      continue;
    }
    if (section !== 'services') {
      // volumes: pgdata bỏ khi postgres prune
      if (section === 'volumes' && dropPgdata(selected, allServices) && /^  pgdata:/.test(line)) {
        continue;
      }
      out.push(line);
      continue;
    }

    if (kind === 'service-block') {
      const name = line.trim().replace(/:$/, '');
      keptService = selected.has(name) ? name : null;
      if (!keptService) {
        skippingService = name;
        prunedInFile.push(name);
      }
      inDependsOn = false;
      if (keptService) out.push(line);
      continue;
    }
    // comment-2space/deeper/blank → thuộc block đang mở (hoặc nền section)
    if (skippingService !== null) continue; // đang cắt block — bỏ line
    if (keptService !== null) {
      if (kind === 'deeper' && /^ {4}depends_on:\s*$/.test(line)) {
        inDependsOn = true;
        pendingDepends.push(line);
        continue;
      }
      if (inDependsOn && kind === 'deeper') {
        const entry = /^ {6}([A-Za-z0-9_-]+):/.exec(line);
        if (entry) {
          // entry mới — xả depends_on pending nếu còn entries
          flushDepends(out, pruned);
          currentDepends.push({ name: entry[1]!, line, deeper: [] });
          continue;
        }
        // dòng con của entry hiện tại (condition: …)
        currentDepends[currentDepends.length - 1]?.deeper.push(line);
        continue;
      }
      if (inDependsOn) {
        // thoát depends_on (comment 2-space / blank) — xả pending rồi ghi line
        flushDepends(out, pruned);
        inDependsOn = false;
      }
      out.push(line);
      continue;
    }
    out.push(line); // nền section (comment section header…)
  }
  flushDepends(out, pruned);
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

// Trạng thái depends_on đang gom (giữ module-level cục bộ qua closure của 1 call
// bằng biến function-scoped — dùng container để flushDepends đọc được).
const pendingDepends: string[] = [];
interface DependsEntry {
  name: string;
  line: string;
  deeper: string[];
}
const currentDepends: DependsEntry[] = [];

function flushDepends(out: string[], pruned: readonly string[]): void {
  if (currentDepends.length === 0) {
    if (pendingDepends.length > 0) out.push(pendingDepends[0]!); // depends_on rỗng
    pendingDepends.length = 0;
    return;
  }
  out.push(pendingDepends[0]!);
  pendingDepends.length = 0;
  for (const entry of currentDepends) {
    if (pruned.includes(entry.name)) continue;
    out.push(entry.line);
    out.push(...entry.deeper);
  }
  currentDepends.length = 0;
}

function textHasPruneNote(out: string[]): boolean {
  return out.some((l) => l.includes('create-wakii-stack: pruned'));
}

function dropPgdata(selected: ReadonlySet<string>, allServices: string[]): boolean {
  return allServices.includes('postgres') && !selected.has('postgres');
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

/** README.md sinh ở đỉnh dest — services chọn + up + smoke + ports. */
export function renderReadme(manifest: StackManifest, selection: StackSelection): string {
  const ports = Object.entries(manifest.ports ?? {})
    .map(([name, url]) => `- ${name}: ${url}`)
    .join('\n');
  return `# ${selection.appName}

Stack generated by \`create-wakii-stack\` (Hybrid C — full template pruned to your selection).

## Services

${selection.services.map((s) => `- ${s} _(${manifest.services[s]?.layer ?? '?'})_`).join('\n')}

## Run

\`\`\`bash
cd ${selection.appName}
cp platform/.env.example platform/.env   # điền secret trước khi up
docker compose --env-file platform/.env up -d
\`\`\`

${manifest.smoke ? `## Smoke\n\n\`\`\`bash\n${manifest.smoke}\n\`\`\`\n` : ''}
${ports ? `## URLs\n\n${ports}\n` : ''}
Need a FE app (SPA) outside this stack? \`pnpm create wakii-app\`.
`;
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

  // 1. xoá paths của service bị prune
  for (const name of pruned) {
    for (const relPath of manifest.services[name]!.paths ?? []) {
      const target = join(dest, relPath);
      if (existsSync(target)) {
        await rm(target, { recursive: true, force: true });
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

  // 5. README sinh ở đỉnh dest
  await writeFile(join(dest, 'README.md'), renderReadme(manifest, selection));
  files.push('README.md');

  return { files: files.map((f) => f.slice(dest.length + 1)), prunedServices: pruned };
}
