// Tests scaffold — fixture template nhỏ (3 services giả + manifest) trong tmp:
// copy + render placeholders · prune compose khối/depends_on/pgdata · gateway
// conf marker · env keys · paths · README sinh. KHÔNG network.
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scaffold, unfreezeDockerfiles } from './scaffold.js';
import type { StackSelection } from './options.js';

const COMPOSE = `services:
  postgres:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data

  spring-svc:
    image: spring
    depends_on:
      postgres:
        condition: service_healthy

  dotnet-svc:
    image: dotnet
    depends_on:
      postgres:
        condition: service_healthy

  gateway:
    image: nginx
    depends_on:
      auth-svc:
        condition: service_healthy
      node-svc:
        condition: service_healthy

  node-svc:
    image: node
    depends_on:
      postgres:
        condition: service_healthy
      spring-svc:
        condition: service_healthy
      spring-svc-extra:
        condition: service_started

volumes:
  pgdata:
`;

const GATEWAY_CONF = `http {
  upstream auth_svc {
    server auth-svc:8090;
  }

  upstream node_svc {
    server node-svc:3001;
  }

  upstream dotnet_svc {
    server dotnet-svc:8083;
  }

  server {
    location /api/auth {
      proxy_pass http://auth_svc;
    }

    location /api/tasks {
      proxy_pass http://node_svc;
    }

    location /api/dotnet {
      proxy_pass http://dotnet_svc;
    }
  }
}
`;

const ENV = `POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme
NODE_SVC_DB_PASSWORD=nodedb
SPRING_SVC_DB_PASSWORD=springdb
DOTNET_SVC_DB_PASSWORD=dotnetdb
JWT_SECRET=secret
DOTNET_SVC_PORT=8083
`;

const MANIFEST = {
  version: 1,
  services: {
    postgres: { layer: 'core', envKeys: ['DOTNET_SVC_DB_PASSWORD'] },
    'auth-svc': { layer: 'core' },
    gateway: { layer: 'core' },
    'node-svc': {
      layer: 'be',
      paths: ['services/node-svc'],
      envKeys: ['NODE_SVC_DB_PASSWORD'],
      gatewayBlocks: ['upstream node_svc', 'location /api/tasks'],
    },
    'spring-svc': { layer: 'be', paths: ['services/spring-svc'], envKeys: ['SPRING_SVC_DB_PASSWORD'] },
    'dotnet-svc': {
      layer: 'be',
      paths: ['services/dotnet-svc'],
      envKeys: ['DOTNET_SVC_PORT'],
      gatewayBlocks: ['upstream dotnet_svc', 'location /api/dotnet'],
    },
    shell: { layer: 'fe' },
  },
  files: {
    compose: 'platform/docker-compose.yml',
    env: 'platform/.env.example',
    gatewayConf: 'platform/gateway/nginx/nginx.conf',
  },
  ports: { gateway: 'http://localhost:8080', shell: 'http://localhost:3000' },
  smoke: 'bash scripts/smoke/e2e.sh',
};

let root: string;
let templateRoot: string;
let dest: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'cws-engine-'));
  templateRoot = join(root, 'stack-template');
  dest = join(root, 'dest');

  // fixture template
  await mkdir(join(templateRoot, 'platform', 'gateway', 'nginx'), { recursive: true });
  await mkdir(join(templateRoot, 'services', 'node-svc'), { recursive: true });
  await mkdir(join(templateRoot, 'services', 'spring-svc'), { recursive: true });
  await writeFile(join(templateRoot, 'stack-manifest.json'), JSON.stringify(MANIFEST));
  await writeFile(join(templateRoot, 'platform', 'docker-compose.yml'), COMPOSE);
  await writeFile(join(templateRoot, 'platform', '.env.example'), ENV);
  await writeFile(join(templateRoot, 'platform', 'gateway', 'nginx', 'nginx.conf'), GATEWAY_CONF);
  await writeFile(join(templateRoot, 'services', 'node-svc', 'index.js'), '// __STACK_NAME__ node');
  await writeFile(join(templateRoot, 'services', 'spring-svc', 'pom.xml'), '<!-- spring -->');
  await mkdir(join(templateRoot, 'services', 'dotnet-svc'), { recursive: true });
  await writeFile(join(templateRoot, 'services', 'dotnet-svc', 'Dockerfile'), 'FROM scratch\n');
  await writeFile(join(templateRoot, '.DS_Store'), 'junk');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function selection(partial: Partial<StackSelection>): StackSelection {
  return { appName: 'my-stack', services: ['postgres', 'gateway', 'node-svc', 'shell'], skipInstall: false, ...partial };
}

describe('scaffold — copy + render', () => {
  it('copy template, skip .DS_Store, render __STACK_NAME__ + __STACK_ORG__', async () => {
    const result = await scaffold({ selection: selection({ appName: 'hop-stack' }), dest, templateRoot });

    expect(existsSync(join(dest, 'stack-manifest.json'))).toBe(true);
    expect(existsSync(join(dest, '.DS_Store'))).toBe(false);
    const nodeSrc = await readFile(join(dest, 'services', 'node-svc', 'index.js'), 'utf8');
    expect(nodeSrc).toContain('// hop-stack node'); // __STACK_NAME__ render
    expect(nodeSrc).not.toContain('__STACK_NAME__');
    expect(result.files).toContain('README.md');
  });
});

describe('scaffold — prune compose', () => {
  it('bỏ khối service không chọn + chèn warning comment; khối giữ nguyên', async () => {
    // chọn node-svc (+gateway/postgres theo rules thực tế làm ở options — ở đây truyền thẳng)
    await scaffold({ selection: selection({ services: ['postgres', 'gateway', 'node-svc', 'shell'] }), dest, templateRoot });
    const out = await readFile(join(dest, 'platform', 'docker-compose.yml'), 'utf8');

    expect(out).not.toContain('  spring-svc:');
    expect(out).toContain('create-wakii-stack: pruned auth-svc, spring-svc'); // theo thứ tự manifest
    expect(out).toContain('  node-svc:'); // khối giữ nguyên
    expect(out).toContain('  postgres:');
  });

  it('depends_on tham chiếu service đã prune → entry bị xoá, entry giữ lại nguyên con', async () => {
    // chọn node-svc + postgres (+gateway/shell): spring-svc bị prune → node.depends_on
    // mất entry spring-svc, giữ postgres + spring-svc-extra (ngoài manifest — giữ)
    await scaffold(
      { selection: selection({ services: ['postgres', 'gateway', 'node-svc', 'shell'] }), dest, templateRoot },
    );
    const out = await readFile(join(dest, 'platform', 'docker-compose.yml'), 'utf8');

    // node-svc giữ: depends_on postgres còn, spring-svc đã cắt (neo 6-space entry)
    const nodeBlock = out.slice(out.indexOf('\n  node-svc:'), out.indexOf('\nvolumes:'));
    expect(nodeBlock).toContain('postgres:');
    expect(nodeBlock).toContain('condition: service_healthy'); // con của entry giữ
    expect(nodeBlock).not.toContain('\n      spring-svc:'); // entry 6-space đã bị xoá
  });

  it('depends_on rỗng hoàn toàn → xoá luôn dòng depends_on', async () => {
    // gateway GIỮ nhưng phụ thuộc auth-svc + node-svc bị prune cả hai → depends_on rỗng
    await scaffold({ selection: selection({ services: ['postgres', 'gateway', 'shell'] }), dest, templateRoot });
    const out = await readFile(join(dest, 'platform', 'docker-compose.yml'), 'utf8');
    const gatewayBlock = out.slice(out.indexOf('\n  gateway:'), out.indexOf('\n  shell:'));
    expect(gatewayBlock).not.toContain('depends_on');
    expect(gatewayBlock).toContain('image: nginx');
  });

  it('postgres bị prune → volume pgdata bị xoá', async () => {
    await scaffold({ selection: selection({ services: ['gateway', 'shell'] }), dest, templateRoot });
    const out = await readFile(join(dest, 'platform', 'docker-compose.yml'), 'utf8');
    expect(out).not.toContain('pgdata');
  });
});

describe('scaffold — gateway conf + env + paths', () => {
  it('gatewayBlocks của service prune → khối nginx biến mất, khối khác giữ', async () => {
    await scaffold({ selection: selection({ services: ['postgres', 'gateway', 'shell'] }), dest, templateRoot });
    const conf = await readFile(join(dest, 'platform', 'gateway', 'nginx', 'nginx.conf'), 'utf8');
    expect(conf).not.toContain('upstream node_svc');
    expect(conf).not.toContain('location /api/tasks');
    expect(conf).toContain('upstream auth_svc'); // block khác giữ nguyên
    expect(conf).toContain('location /api/auth');
  });

  it('envKeys của service prune → dòng biến biến mất', async () => {
    await scaffold({ selection: selection({ services: ['postgres', 'gateway', 'shell'] }), dest, templateRoot });
    const env = await readFile(join(dest, 'platform', '.env.example'), 'utf8');
    expect(env).not.toContain('NODE_SVC_DB_PASSWORD');
    expect(env).not.toContain('SPRING_SVC_DB_PASSWORD');
    expect(env).toContain('POSTGRES_USER=postgres');
    expect(env).toContain('JWT_SECRET=secret');
  });

  it('paths của service prune → thư mục bị xoá', async () => {
    await scaffold({ selection: selection({ services: ['postgres', 'gateway', 'shell'] }), dest, templateRoot });
    expect(existsSync(join(dest, 'services', 'node-svc'))).toBe(false);
    expect(existsSync(join(dest, 'services', 'spring-svc'))).toBe(false);
  });
});

describe('scaffold — dọn workspace refs sau prune', () => {
  it('Dockerfile COPY + pnpm-lock importer + workspace glob trỏ dir đã prune bị dọn hết', async () => {
    // fixture mở rộng: tooling/spike + Dockerfile FE + lockfile + workspace
    await mkdir(join(templateRoot, 'app', 'spike', 'host'), { recursive: true });
    await writeFile(join(templateRoot, 'app', 'spike', 'host', 'package.json'), '{"name":"spike-host"}');
    await mkdir(join(templateRoot, 'app', 'shell'), { recursive: true });
    await writeFile(
      join(templateRoot, 'app', 'shell', 'Dockerfile'),
      'FROM node:22-alpine\nCOPY app/spike/host/package.json app/spike/host/\nCOPY app/shell/package.json app/shell/\n',
    );
    await writeFile(
      join(templateRoot, 'pnpm-workspace.yaml'),
      'packages:\n  - "app/*"\n  # Spike MF/Rspack (SF-1)\n  - "app/spike/*"\n',
    );
    await writeFile(
      join(templateRoot, 'pnpm-lock.yaml'),
      'lockfileVersion: 9.0.0\nimporters:\n  .:\n    dependencies: {}\n  app/shell:\n    dependencies: {}\n  app/spike/host:\n    dependencies: {}\n  services/node-svc:\n    dependencies: {}\n\npackages:\n',
    );

    // KHÔNG chọn node-svc → prunedPaths gồm app/spike (ALWAYS) + services/node-svc (service)
    await scaffold({ selection: selection({ services: ['postgres', 'gateway', 'shell'] }), dest, templateRoot });

    const dockerfile = await readFile(join(dest, 'app', 'shell', 'Dockerfile'), 'utf8');
    expect(dockerfile).not.toContain('app/spike');
    expect(dockerfile).toContain('COPY app/shell/package.json');

    const lock = await readFile(join(dest, 'pnpm-lock.yaml'), 'utf8');
    expect(lock).not.toContain('app/spike/host:');
    expect(lock).not.toContain('services/node-svc:');
    expect(lock).toContain('app/shell:');
    expect(lock).toContain('  .:');

    const ws = await readFile(join(dest, 'pnpm-workspace.yaml'), 'utf8');
    expect(ws).not.toContain('app/spike/*');
    expect(ws).not.toContain('# Spike MF/Rspack'); // comment mồ côi của glob bị dọn
    expect(ws).toContain('- "app/*"');
  });
});

describe('scaffold — dotnet-svc selection (ADR-0011 BE service)', () => {
  it('selection includes dotnet-svc → compose block + gateway block + env keys + path kept', async () => {
    await scaffold(
      { selection: selection({ services: ['postgres', 'gateway', 'node-svc', 'shell', 'dotnet-svc'] }), dest, templateRoot },
    );
    const out = await readFile(join(dest, 'platform', 'docker-compose.yml'), 'utf8');
    expect(out).toContain('  dotnet-svc:'); // compose block kept
    expect(out).toContain('create-wakii-stack: pruned auth-svc, spring-svc'); // only unselected pruned
    const conf = await readFile(join(dest, 'platform', 'gateway', 'nginx', 'nginx.conf'), 'utf8');
    expect(conf).toContain('upstream dotnet_svc');
    expect(conf).toContain('location /api/dotnet');
    const env = await readFile(join(dest, 'platform', '.env.example'), 'utf8');
    expect(env).toContain('DOTNET_SVC_PORT=8083');
    expect(env).toContain('DOTNET_SVC_DB_PASSWORD=dotnetdb'); // belongs to postgres (init script role)
    expect(existsSync(join(dest, 'services', 'dotnet-svc'))).toBe(true);
  });

  it('dotnet-svc NOT selected → compose block, gateway marker, port key, path all pruned (DB password kept with postgres)', async () => {
    const dest2 = join(root, 'dest2');
    await scaffold({ selection: selection({ services: ['postgres', 'gateway', 'node-svc', 'shell'] }), dest: dest2, templateRoot });
    const out = await readFile(join(dest2, 'platform', 'docker-compose.yml'), 'utf8');
    expect(out).not.toContain('  dotnet-svc:');
    expect(out).toContain('create-wakii-stack: pruned auth-svc, spring-svc, dotnet-svc'); // manifest order
    const conf = await readFile(join(dest2, 'platform', 'gateway', 'nginx', 'nginx.conf'), 'utf8');
    expect(conf).not.toContain('dotnet_svc');
    expect(conf).not.toContain('/api/dotnet');
    const env = await readFile(join(dest2, 'platform', '.env.example'), 'utf8');
    expect(env).not.toContain('DOTNET_SVC_PORT');
    expect(env).toContain('DOTNET_SVC_DB_PASSWORD=dotnetdb'); // postgres still selected
    expect(existsSync(join(dest2, 'services', 'dotnet-svc'))).toBe(false);
  });
});

describe('scaffold — README sinh', () => {
  it('README.md ở đỉnh dest: services chọn + up + smoke + ports', async () => {
    await scaffold({ selection: selection({ appName: 'hop-stack', services: ['postgres', 'gateway', 'node-svc', 'shell'] }), dest, templateRoot });
    const readme = await readFile(join(dest, 'README.md'), 'utf8');
    expect(readme).toContain('# hop-stack');
    expect(readme).toContain('- node-svc _(be)_');
    expect(readme).toContain('docker compose -f platform/docker-compose.yml --env-file platform/.env up -d');
    expect(readme).toContain('bash scripts/smoke/e2e.sh');
    expect(readme).toContain('http://localhost:8080');
    expect(readme).toContain('http://localhost:3000');
    // Section Truy cập: gateway = entry duy nhất + cảnh báo 405 khi mở port FE trực tiếp
    expect(readme).toContain('## Truy cập');
    expect(readme).toContain('entry duy nhất');
    expect(readme).toContain('405');
    expect(readme).toContain('Đăng ký');
  });

  it('luôn prune tooling meta (create-wakii-app/stack, starter-templates, spike) — không phụ thuộc lựa chọn', async () => {
    // fixture beforeEach không có các dir này — tạo giả trong template
    await mkdir(join(templateRoot, 'app', 'create-wakii-app'), { recursive: true });
    await writeFile(join(templateRoot, 'app', 'create-wakii-app', 'package.json'), '{}');
    await mkdir(join(templateRoot, 'app', 'spike'), { recursive: true });
    await writeFile(join(templateRoot, 'app', 'spike', 'x.ts'), 'x');
    await scaffold({ selection: selection({ services: ['postgres', 'gateway', 'node-svc'] }), dest, templateRoot: templateRoot });
    expect(existsSync(join(dest, 'app', 'create-wakii-app'))).toBe(false);
    expect(existsSync(join(dest, 'app', 'spike'))).toBe(false);
  });
});
describe('scaffold — FE registry deps (ui-kit npm; shared GIỮ workspace)', () => {
  /** Fixture mở rộng: FE shell (package.json workspace:* + Dockerfile COPY +
   *  rspack include pattern) + app/ui-kit + app/shared + lock/workspace. */
  async function seedFeFixture(): Promise<void> {
    await mkdir(join(templateRoot, 'app', 'shell'), { recursive: true });
    await mkdir(join(templateRoot, 'app', 'ui-kit', 'src'), { recursive: true });
    await mkdir(join(templateRoot, 'app', 'shared', 'src'), { recursive: true });
    await mkdir(join(templateRoot, 'app', 'spike', 'host'), { recursive: true });
    await writeFile(
      join(templateRoot, 'app', 'shell', 'package.json'),
      JSON.stringify(
        {
          name: '@wakii/shell',
          dependencies: { '@wakii/fe-shared': 'workspace:*', '@wakii/ui-kit': 'workspace:*', react: '19.3.0' },
        },
        null,
        2,
      ) + '\n',
    );
    await writeFile(
      join(templateRoot, 'app', 'shell', 'Dockerfile'),
      'FROM node:22-alpine\nCOPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./\nCOPY app/shared/package.json app/shared/\nCOPY app/ui-kit/package.json app/ui-kit/\nRUN pnpm install --frozen-lockfile --filter @wakii/shell...\nCOPY app/shared app/shared\nCOPY app/ui-kit app/ui-kit\nCOPY app/shell app/shell\n',
    );
    // pattern literal trong source rspack: /[\\/]app[\\/](shared|ui-kit)[\\/]src/
    await writeFile(
      join(templateRoot, 'app', 'shell', 'rspack.config.mjs'),
      "export default { module: { rules: [{ test: /\\.tsx?$/, loader: 'swc-loader', include: [path.resolve(rootDir, 'src'), /[\\\\/]app[\\\\/](shared|ui-kit)[\\\\/]src/] }] } };\n",
    );
    await writeFile(join(templateRoot, 'app', 'ui-kit', 'package.json'), JSON.stringify({ name: '@wakii/ui-kit', version: '0.7.1' }) + '\n');
    await writeFile(join(templateRoot, 'app', 'ui-kit', 'src', 'index.ts'), 'export const x = 1;\n');
    await writeFile(join(templateRoot, 'app', 'shared', 'package.json'), JSON.stringify({ name: '@wakii/fe-shared', version: '0.1.0' }) + '\n');
    await writeFile(join(templateRoot, 'app', 'shared', 'src', 'index.ts'), 'export const y = 1;\n');
    await writeFile(join(templateRoot, 'app', 'spike', 'host', 'package.json'), '{}\n');
    await writeFile(
      join(templateRoot, 'pnpm-workspace.yaml'),
      'packages:\n  - "app/*"\n  # Spike MF/Rspack (SF-1)\n  - "app/spike/*"\n',
    );
    await writeFile(
      join(templateRoot, 'pnpm-lock.yaml'),
      [
        "lockfileVersion: '9.0'",
        'importers:',
        '  .:',
        '    dependencies: {}',
        '  app/shell:',
        '    dependencies:',
        "      '@wakii/fe-shared':",
        '        specifier: workspace:*',
        '        version: link:../shared',
        "      '@wakii/ui-kit':",
        '        specifier: workspace:*',
        '        version: link:../ui-kit',
        '  app/shared:',
        '    dependencies: {}',
        '  app/ui-kit:',
        '    dependencies: {}',
        '  app/spike/host:',
        '    dependencies: {}',
        '',
        'packages: {}',
        '',
      ].join('\n'),
    );
  }

  it('prune app/ui-kit + rewrite workspace:* → latest; app/shared GIỮ NGUYÊN', async () => {
    await seedFeFixture();
    await scaffold({ selection: selection({}), dest, templateRoot, lockfileSync: false });

    // source: ui-kit biến mất — shared GIỮ (điều chỉnh coordinator 2026-10-27)
    expect(existsSync(join(dest, 'app', 'ui-kit'))).toBe(false);
    expect(existsSync(join(dest, 'app', 'shared', 'src', 'index.ts'))).toBe(true);
    expect(existsSync(join(dest, 'app', 'spike'))).toBe(false); // ALWAYS prune như cũ

    // shell package.json: ui-kit → latest; fe-shared giữ workspace:*; react không đụng
    const shell = JSON.parse(await readFile(join(dest, 'app', 'shell', 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(shell.dependencies['@wakii/ui-kit']).toBe('latest');
    expect(shell.dependencies['@wakii/fe-shared']).toBe('workspace:*');
    expect(shell.dependencies['react']).toBe('19.3.0');

    // Dockerfile: đủ 2 dạng COPY app/ui-kit bị xoá, COPY app/shared giữ
    const dockerfile = await readFile(join(dest, 'app', 'shell', 'Dockerfile'), 'utf8');
    expect(dockerfile).not.toContain('app/ui-kit');
    expect(dockerfile).toContain('COPY app/shared/package.json app/shared/');
    expect(dockerfile).toContain('COPY app/shared app/shared');

    // lock: importer app/ui-kit strip — app/shared + shell còn
    const lock = await readFile(join(dest, 'pnpm-lock.yaml'), 'utf8');
    expect(lock).not.toContain('  app/ui-kit:');
    expect(lock).toContain('  app/shared:');
    expect(lock).toContain('  app/shell:');

    // rspack include: pattern thu về shared (ui-kit biến mất khỏi pattern)
    const config = await readFile(join(dest, 'app', 'shell', 'rspack.config.mjs'), 'utf8');
    expect(config).toContain('[\\\\/]app[\\\\/]shared[\\\\/]src/');
    expect(config).not.toContain('ui-kit');

    // workspace yaml: glob app/* giữ (shared vẫn thuộc workspace)
    const ws = await readFile(join(dest, 'pnpm-workspace.yaml'), 'utf8');
    expect(ws).toContain('- "app/*"');

    // README sinh mục Packages đúng semantics mới
    const readme = await readFile(join(dest, 'README.md'), 'utf8');
    expect(readme).toContain('## Packages');
    expect(readme).toContain('**`@wakii/ui-kit`** từ npm registry');
    expect(readme).toContain('nâng cấp bằng `pnpm update @wakii/ui-kit`');
    expect(readme).toContain('@wakii/fe-shared` vẫn consumed qua source `app/shared`');
  });

  it('unfreezeDockerfiles — fallback bỏ cờ --frozen-lockfile (khi không có pnpm)', async () => {
    await seedFeFixture();
    await scaffold({ selection: selection({}), dest, templateRoot, lockfileSync: false });
    expect(await readFile(join(dest, 'app', 'shell', 'Dockerfile'), 'utf8')).toContain('--frozen-lockfile');
    expect(await unfreezeDockerfiles(dest)).toBe(1);
    const dockerfile = await readFile(join(dest, 'app', 'shell', 'Dockerfile'), 'utf8');
    expect(dockerfile).not.toContain('--frozen-lockfile');
    expect(dockerfile).toContain('pnpm install --filter @wakii/shell...');
  });
});
