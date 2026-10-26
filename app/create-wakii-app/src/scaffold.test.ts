// Tests scaffold — fixture templates GIẢ nhỏ trong tmp (không phụ thuộc worker
// starter-templates): copy + render placeholder + skip .DS_Store + binary nguyên
// bản + overlay router/extras + merge deps + JS variant (đổi đuôi overlay).
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scaffold, type ScaffoldInput } from './scaffold.js';

let root: string;
let dest: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'cwa-engine-'));
  dest = join(root, 'dest');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/** Dựng fixture template theo cấu trúc spec (đủ để test mọi nhánh engine). */
async function makeTemplates(): Promise<string> {
  const t = join(root, 'starter-templates');
  // base TS
  await mkdir(join(t, 'vite-ts', 'src'), { recursive: true });
  await writeFile(join(t, 'vite-ts', 'package.json'), JSON.stringify({ name: '{{appName}}', dependencies: { react: '^19' } }));
  await writeFile(join(t, 'vite-ts', 'vite.config.ts'), 'export default {}; // {{appName}}');
  await writeFile(join(t, 'vite-ts', 'src', 'main.tsx'), "import './styles.css';\n// app {{appName}}");
  await writeFile(join(t, 'vite-ts', '.DS_Store'), 'junk');
  const binary = Buffer.from([0x00, 0x01, ...Buffer.from('{{appName}}')]);
  await writeFile(join(t, 'vite-ts', 'logo.png'), binary);
  // base JS
  await mkdir(join(t, 'vite-js', 'src'), { recursive: true });
  await writeFile(join(t, 'vite-js', 'package.json'), JSON.stringify({ name: '{{appName}}' }));
  await writeFile(join(t, 'vite-js', 'src', 'main.jsx'), '// js app {{appName}}');
  // preset minimal-ts (template có sẵn router — KHÔNG cần merge deps)
  await mkdir(join(t, 'minimal-ts', 'src', 'routes'), { recursive: true });
  await writeFile(
    join(t, 'minimal-ts', 'package.json'),
    JSON.stringify({ name: '{{appName}}', dependencies: { react: '^19', 'react-router': '^7.9.0' } }),
  );
  await writeFile(join(t, 'minimal-ts', 'src', 'main.tsx'), "// minimal main {{appName}}");
  await writeFile(join(t, 'minimal-ts', 'src', 'routes', 'home.tsx'), '// minimal home {{appName}}');
  // preset product-ts (data layer đóng gói sẵn)
  await mkdir(join(t, 'product-ts', 'src', 'routes'), { recursive: true });
  await mkdir(join(t, 'product-ts', 'src', 'features', 'tasks'), { recursive: true });
  await writeFile(
    join(t, 'product-ts', 'package.json'),
    JSON.stringify({ name: '{{appName}}', dependencies: { react: '^19', 'react-router': '^7.9.0', '@tanstack/react-query': '^5' } }),
  );
  await writeFile(join(t, 'product-ts', 'src', 'main.tsx'), "// product main {{appName}}");
  await writeFile(join(t, 'product-ts', 'src', 'routes', 'home.tsx'), '// product home {{appName}}');
  await writeFile(join(t, 'product-ts', 'src', 'features', 'tasks', 'index.ts'), "// tasks index {{appName}}");
  // overlay admin — đè lên product-ts (mirror cấu trúc dest 1:1)
  await mkdir(join(t, 'template-feats', 'admin', 'src', 'routes'), { recursive: true });
  await writeFile(join(t, 'template-feats', 'admin', 'src', 'routes', 'home.tsx'), '// ADMIN home {{appName}}');
  await writeFile(join(t, 'template-feats', 'admin', 'src', 'routes', 'login.tsx'), '// admin login {{appName}}');
  // overlay router (TS gốc) — overlay tree MIRROR cấu trúc dest (1:1):
  // template-feats/router/src/App.tsx → dest/src/App.tsx
  await mkdir(join(t, 'template-feats', 'router', 'src'), { recursive: true });
  await writeFile(join(t, 'template-feats', 'router', 'src', 'App.tsx'), 'export default () => <h1>{{appName}} routed</h1>;');
  await writeFile(join(t, 'template-feats', 'router', 'src', 'main.tsx'), '// router main {{appName}}');
  // overlay extra chart + schedule + editor (schedule/editor: fixture cho test multi-deps)
  await mkdir(join(t, 'template-feats', 'extras', 'chart', 'src'), { recursive: true });
  await writeFile(join(t, 'template-feats', 'extras', 'chart', 'src', 'ChartPage.tsx'), '// chart page {{appName}}');
  await mkdir(join(t, 'template-feats', 'extras', 'schedule', 'src'), { recursive: true });
  await writeFile(join(t, 'template-feats', 'extras', 'schedule', 'src', 'SchedulePage.tsx'), '// schedule page {{appName}}');
  await mkdir(join(t, 'template-feats', 'extras', 'editor', 'src'), { recursive: true });
  await writeFile(join(t, 'template-feats', 'extras', 'editor', 'src', 'EditorPage.tsx'), '// editor page {{appName}}');
  return t;
}

async function run(planOverrides: Partial<ScaffoldInput['plan']>, templatesRoot: string) {
  const plan = {
    appName: 'my-app',
    lang: 'ts' as const,
    router: false,
    extras: [] as never[],
    preset: 'demo' as const,
    variant: 'vite' as const,
    skipInstall: false,
    ...planOverrides,
  };
  const log = vi.fn();
  const result = await scaffold({ plan, dest, templatesRoot, log });
  return { result, log };
}

describe('scaffold — base copy + render', () => {
  it('copy đủ file, skip .DS_Store, render {{appName}} mọi file text', async () => {
    const templatesRoot = await makeTemplates();
    const { result } = await run({ appName: 'hop-quy' }, templatesRoot);

    expect(existsSync(join(dest, 'package.json'))).toBe(true);
    expect(existsSync(join(dest, 'vite.config.ts'))).toBe(true);
    expect(existsSync(join(dest, 'src', 'main.tsx'))).toBe(true);
    expect(existsSync(join(dest, '.DS_Store'))).toBe(false); // rác macOS bị bỏ

    const pkg = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('hop-quy'); // placeholder render trong JSON
    expect(await readFile(join(dest, 'vite.config.ts'), 'utf8')).toContain('// hop-quy');
    expect(await readFile(join(dest, 'src', 'main.tsx'), 'utf8')).toContain('app hop-quy');

    // result.files là path tương đối dest
    expect(result.files).toContain(join('src', 'main.tsx'));
  });

  it('file binary (có byte 0x00) copy NGUYÊN BẢN — không render placeholder', async () => {
    const templatesRoot = await makeTemplates();
    await run({ appName: 'bin-app' }, templatesRoot);
    const buf = await readFile(join(dest, 'logo.png'));
    expect(buf[0]).toBe(0x00);
    expect(buf.toString('latin1')).toContain('{{appName}}'); // KHÔNG bị thay
  });
});

describe('scaffold — overlays + deps', () => {
  it('router=true → overlay ghi đè App/main; deps +react-router', async () => {
    const templatesRoot = await makeTemplates();
    const { log } = await run({ appName: 'r-app', router: true }, templatesRoot);

    expect(await readFile(join(dest, 'src', 'App.tsx'), 'utf8')).toContain('r-app routed');
    expect(await readFile(join(dest, 'src', 'main.tsx'), 'utf8')).toContain('router main r-app');
    const pkg = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
    expect(pkg.dependencies['react-router']).toBe('^7.9.0');
    expect(log).toHaveBeenCalledWith('Apply overlay: router');
  });

  it('extras → overlay copy + deps tương ứng (chart → chart.js)', async () => {
    const templatesRoot = await makeTemplates();
    await run({ appName: 'c-app', extras: ['chart'] }, templatesRoot);

    expect(await readFile(join(dest, 'src', 'ChartPage.tsx'), 'utf8')).toContain('chart page c-app');
    const pkg = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
    expect(pkg.dependencies['chart.js']).toBe('^4.5.1');
    expect(pkg.dependencies['react-router']).toBeUndefined(); // router=false → không thêm
  });

  it('extra nhiều peer deps → merge đủ list (schedule 3 fullcalendar, editor 2 tiptap)', async () => {
    const templatesRoot = await makeTemplates();
    await run({ appName: 'm-app', extras: ['schedule', 'editor'] }, templatesRoot);

    const pkg = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
    expect(pkg.dependencies['@fullcalendar/core']).toBe('^6.1.22');
    expect(pkg.dependencies['@fullcalendar/daygrid']).toBe('^6.1.22');
    expect(pkg.dependencies['@fullcalendar/interaction']).toBe('^6.1.22');
    expect(pkg.dependencies['@tiptap/react']).toBe('^3.32.0');
    expect(pkg.dependencies['@tiptap/starter-kit']).toBe('^3.32.0');
  });

  it('overlay thiếu (extra không có trong template) → throw message rõ', async () => {
    const templatesRoot = await makeTemplates();
    // fixture giờ có chart/schedule/editor (test multi-deps) — carousel là extra
    // duy nhất fixture KHÔNG tạo → dùng làm case thiếu overlay
    await expect(run({ extras: ['carousel'] }, templatesRoot)).rejects.toThrow("Không thấy overlay extra 'carousel'");
  });
});

describe('scaffold — JS variant', () => {
  it('lang=js → base vite-js (.jsx); overlay TS đổi đuôi .tsx→.jsx', async () => {
    const templatesRoot = await makeTemplates();
    await run({ appName: 'js-app', lang: 'js', router: true }, templatesRoot);

    expect(existsSync(join(dest, 'src', 'main.jsx'))).toBe(true);
    expect(existsSync(join(dest, 'src', 'main.tsx'))).toBe(false); // không trộn variant
    expect(await readFile(join(dest, 'src', 'App.jsx'), 'utf8')).toContain('js-app routed'); // rename + render
    expect(await readFile(join(dest, 'src', 'main.jsx'), 'utf8')).toContain('router main js-app');
    const pkg = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
    expect(pkg.dependencies['react-router']).toBe('^7.9.0'); // deps merge vẫn chạy
  });
});

describe('scaffold — presets (minimal/product/admin)', () => {
  it('preset minimal → base minimal-ts, KHÔNG overlay router, KHÔNG merge deps router', async () => {
    const templatesRoot = await makeTemplates();
    const { log } = await run({ appName: 'mini', preset: 'minimal', router: true }, templatesRoot);

    expect(await readFile(join(dest, 'src', 'main.tsx'), 'utf8')).toContain('minimal main mini');
    expect(await readFile(join(dest, 'src', 'routes', 'home.tsx'), 'utf8')).toContain('minimal home mini');
    expect(existsSync(join(dest, 'src', 'App.tsx'))).toBe(false); // overlay router không dính
    // deps giữ nguyên từ template — không merge thêm react-router
    const pkg = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
    expect(pkg.dependencies['react-router']).toBe('^7.9.0');
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('Merge deps'));
  });

  it('preset product → base product-ts + features/tasks; không overlay', async () => {
    const templatesRoot = await makeTemplates();
    await run({ appName: 'prod', preset: 'product', router: true }, templatesRoot);

    expect(await readFile(join(dest, 'src', 'main.tsx'), 'utf8')).toContain('product main prod');
    expect(await readFile(join(dest, 'src', 'features', 'tasks', 'index.ts'), 'utf8')).toContain('tasks index prod');
    expect(existsSync(join(dest, 'src', 'routes', 'login.tsx'))).toBe(false); // overlay admin không dính
    const pkg = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
    expect(pkg.dependencies['@tanstack/react-query']).toBe('^5');
  });

  it('preset admin → product-ts + overlay đè home.tsx + thêm login.tsx', async () => {
    const templatesRoot = await makeTemplates();
    const { log } = await run({ appName: 'adm', preset: 'admin', router: true }, templatesRoot);

    expect(await readFile(join(dest, 'src', 'routes', 'home.tsx'), 'utf8')).toContain('ADMIN home adm'); // đè
    expect(await readFile(join(dest, 'src', 'routes', 'login.tsx'), 'utf8')).toContain('admin login adm'); // thêm
    expect(await readFile(join(dest, 'src', 'features', 'tasks', 'index.ts'), 'utf8')).toContain('tasks index adm'); // giữ từ product
    const pkg = JSON.parse(await readFile(join(dest, 'package.json'), 'utf8'));
    expect(pkg.dependencies['@tanstack/react-query']).toBe('^5'); // deps product nguyên vẹn
    expect(log).toHaveBeenCalledWith('Apply overlay: admin (layout + dashboard + auth)');
  });

  it('overlay admin thiếu trong templatesRoot → throw message rõ', async () => {
    const t = await makeTemplates();
    await rm(join(t, 'template-feats', 'admin'), { recursive: true, force: true });
    await expect(run({ preset: 'admin', router: true }, t)).rejects.toThrow('Không thấy overlay admin');
  });

  it('preset minimal thiếu template → throw message rõ', async () => {
    const t = await makeTemplates();
    await rm(join(t, 'minimal-ts'), { recursive: true, force: true });
    await expect(run({ preset: 'minimal', router: true }, t)).rejects.toThrow('Không thấy template base');
  });
});
