// scaffold — copy đệ quy template → render {{appName}} → áp overlays router/
// extras → merge deps vào package.json. Tách hàm thuần (test được với tmp dir
// thật, KHÔNG network). Placeholder DUY NHẤT: {{appName}} — file binary (có
// byte 0x00) copy nguyên bản KHÔNG render (spec: không regex trên binary).
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Extra, ScaffoldPlan } from './options.js';

/** Nguồn template mặc định — 2 layout: repo (src|dist → app/starter-templates)
 * và npm package (dist → <pkg>/starter-templates, publish script bundle vào).
 * Chọn thư mục ĐẦU TIÊN tồn tại thực tế. */
function resolveTemplatesRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [
    resolve(here, '../../starter-templates'), // repo: app/create-wakii-app/{src,dist}
    resolve(here, '../starter-templates'), // npm: <pkg>/dist + <pkg>/starter-templates
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return resolve(here, '../../starter-templates');
}
export const DEFAULT_TEMPLATES_ROOT = resolveTemplatesRoot();

/** Danh sách peer deps theo extra (spec package.json template) — version theo
 * monorepo đang pin. schedule cần đủ 3 package fullcalendar, editor cần cả
 * @tiptap/react + @tiptap/starter-kit (demo đã nghiệm chứng: thiếu → runtime
 * lazy-import fallback). */
const EXTRA_DEPS: Record<Extra, { name: string; range: string }[]> = {
  chart: [{ name: 'chart.js', range: '^4.5.1' }],
  carousel: [{ name: 'swiper', range: '^14.3.0' }],
  schedule: [
    { name: '@fullcalendar/core', range: '^6.1.22' },
    { name: '@fullcalendar/daygrid', range: '^6.1.22' },
    { name: '@fullcalendar/interaction', range: '^6.1.22' },
  ],
  editor: [
    { name: '@tiptap/react', range: '^3.32.0' },
    { name: '@tiptap/starter-kit', range: '^3.32.0' },
  ],
};

export interface ScaffoldInput {
  plan: ScaffoldPlan;
  /** Thư mục đích (PHẢI chưa tồn tại hoặc rỗng — caller kiểm). */
  dest: string;
  /** Ghi đè nguồn template (mặc định DEFAULT_TEMPLATES_ROOT — test trỏ fixture). */
  templatesRoot?: string;
  /** Bước chạy — CLI in qua @clack, test đếm assert. */
  log?: (message: string) => void;
}

export interface ScaffoldResult {
  /** Đường dẫn file đã ghi (tương đối dest) — phục vụ log/test. */
  files: string[];
}

/** Đuôi đổi khi overlay TS áp xuống variant JS (nội dung overlay phải type-free). */
function renameForJs(path: string): string {
  return path.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js');
}

async function copyTree(srcDir: string, destDir: string, opts: { appName: string; renameExt: boolean; files: string[] }): Promise<void> {
  await mkdir(destDir, { recursive: true });
  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue; // rác macOS — spec bỏ
    const srcPath = join(srcDir, entry.name);
    const outName = opts.renameExt ? renameForJs(entry.name) : entry.name;
    const destPath = join(destDir, outName);
    if (entry.isDirectory()) {
      await copyTree(srcPath, destPath, opts);
      continue;
    }
    const buffer = await readFile(srcPath);
    if (buffer.includes(0)) {
      // binary — copy nguyên bản, KHÔNG render (spec)
      await writeFile(destPath, buffer);
    } else {
      const text = buffer.toString('utf8').replaceAll('{{appName}}', opts.appName);
      await writeFile(destPath, text);
    }
    opts.files.push(destPath);
  }
}

/** Đọc package.json đích → thêm deps router/extras → ghi lại (2-space + \n cuối). */
async function mergeDeps(dest: string, plan: ScaffoldPlan, log?: (message: string) => void): Promise<void> {
  const pkgPath = join(dest, 'package.json');
  if (!existsSync(pkgPath)) return; // template không có package.json → bỏ qua im lặng
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {
    dependencies?: Record<string, string>;
  };
  pkg.dependencies ??= {};
  const additions: string[] = [];
  if (plan.router) {
    pkg.dependencies['react-router'] ??= '^7.9.0';
    additions.push('react-router@^7.9.0');
  }
  for (const extra of plan.extras) {
    for (const dep of EXTRA_DEPS[extra]) {
      pkg.dependencies[dep.name] ??= dep.range;
      additions.push(`${dep.name}@${dep.range}`);
    }
  }
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  if (additions.length) log?.(`Merge deps: +${additions.join(' +')}`);
}

/** Scaffold 1 app: base copy → render → overlays (router trước, extras sau) →
 * render markers extras trong App.tsx router → merge deps vào package.json. */
export async function scaffold(input: ScaffoldInput): Promise<ScaffoldResult> {
  const { plan, dest, log } = input;
  const templatesRoot = input.templatesRoot ?? DEFAULT_TEMPLATES_ROOT;
  const variant = plan.lang === 'js' ? 'vite-js' : 'vite-ts';
  const baseDir = join(templatesRoot, variant);
  if (!existsSync(baseDir)) {
    throw new Error(`Không thấy template base: ${baseDir} (cần ${variant} trong starter-templates)`);
  }

  const files: string[] = [];
  log?.(`Copy base template (${variant})`);
  await copyTree(baseDir, dest, { appName: plan.appName, renameExt: false, files });

  const featsDir = join(templatesRoot, 'template-feats');
  if (plan.router) {
    const routerDir = join(featsDir, 'router');
    if (!existsSync(routerDir)) throw new Error(`Không thấy overlay router: ${routerDir}`);
    // Variant JS có bản riêng (type-free) thì dùng nguyên; không thì copy bản TS + đổi đuôi.
    const jsVariantDir = join(routerDir, 'vite-js');
    const useJsVariant = plan.lang === 'js' && existsSync(jsVariantDir);
    log?.('Apply overlay: router');
    await copyTree(useJsVariant ? jsVariantDir : routerDir, dest, {
      appName: plan.appName,
      renameExt: plan.lang === 'js' && !useJsVariant,
      files,
    });
  }

  for (const extra of plan.extras) {
    const extraDir = join(featsDir, 'extras', extra);
    if (!existsSync(extraDir)) throw new Error(`Không thấy overlay extra '${extra}': ${extraDir}`);
    const jsVariantDir = join(extraDir, 'vite-js');
    const useJsVariant = plan.lang === 'js' && existsSync(jsVariantDir);
    log?.(`Apply overlay: ${extra}`);
    await copyTree(useJsVariant ? jsVariantDir : extraDir, dest, {
      appName: plan.appName,
      renameExt: plan.lang === 'js' && !useJsVariant,
      files,
    });
  }

  if (plan.router) {
    log?.('Render extras markers trong App');
    await renderExtraMarkers(dest, plan, plan.lang === 'js');
  }

  await mergeDeps(dest, plan, log);
  return { files: files.map((f) => f.slice(dest.length + 1)) };
}

/** Extra → component demo + route. File overlay extras/<name>/src/Demo<X>.tsx
 * copy vào dest/src/ — App.tsx router chèn import/link/route qua 3 markers
 * {{EXTRA_IMPORTS}} {{EXTRA_LINKS}} {{EXTRA_ROUTES}} (extras kéo theo router —
 * xem resolveOptions; không extra nào thì markers thay rỗng). */
const EXTRA_COMPONENTS: Record<Extra, { component: string; label: string }> = {
  chart: { component: 'ChartDemo', label: 'Chart' },
  carousel: { component: 'CarouselDemo', label: 'Carousel' },
  schedule: { component: 'ScheduleDemo', label: 'Schedule' },
  editor: { component: 'EditorDemo', label: 'Editor' },
};

async function renderExtraMarkers(dest: string, plan: ScaffoldPlan, isJs: boolean): Promise<void> {
  const ext = isJs ? 'jsx' : 'tsx';
  const appPath = join(dest, `src/App.${ext}`);
  if (!existsSync(appPath)) return;
  const imports: string[] = [];
  const links: string[] = [];
  const routes: string[] = [];
  for (const extra of plan.extras) {
    const { component, label } = EXTRA_COMPONENTS[extra];
    // file overlay: extras/<name>/src/Demo<Cap>.tsx — component <Cap>Demo
    const fileStem = `Demo${extra[0].toUpperCase()}${extra.slice(1)}`;
    imports.push(`import { ${component} } from './${fileStem}';`);
    links.push(`          <NavLink className={NAV_LINK} to="/${extra}">\n            ${label}\n          </NavLink>`);
    routes.push(`          <Route element={<${component} />} path="/${extra}" />`);
  }
  let text = await readFile(appPath, 'utf8');
  text = text
    .replaceAll('{{EXTRA_IMPORTS}}', imports.join('\n'))
    .replaceAll('{{EXTRA_LINKS}}', links.join('\n'))
    .replaceAll('{{EXTRA_ROUTES}}', routes.join('\n'));
  await writeFile(appPath, text);
}
