// Tests patches — pure text patchers against template-shaped fixtures.
import { describe, expect, it } from 'vitest';
import { remoteNames } from './naming.js';
import {
  patchCompose,
  patchEnvExample,
  patchNginxGateway,
  patchShellEnvTypes,
  patchShellRemoteUrls,
  patchShellRspack,
  patchShellVitest,
  patchTraefik,
} from './patches.js';

const names = remoteNames('inventory');

const COMPOSE = `services:
  postgres:
    volumes:
      - pgdata:/var/lib/postgresql/data

  remote-tasks:
    ports:
      - "\${REMOTE_TASKS_PORT:-4001}:4001"

  remote-activity:
    ports:
      - "\${REMOTE_ACTIVITY_PORT:-4002}:4002"

volumes:
  pgdata:
`;

const NGINX = `http {
    default_type application/octet-stream;

    map $uri $remote_up {
        ~^/remotes/tasks/    "http://remote-tasks:4001";
        ~^/remotes/activity/ "http://remote-activity:4002";
        default              "http://shell:3000";
    }
}
`;

const TRAEFIK = `http:
  middlewares:
    strip-remotes-activity:
      stripPrefix:
        prefixes: ["/remotes/activity"]

  routers:
    remotes-activity:
      rule: "PathPrefix(\`/remotes/activity\`)"
      service: remote-activity
      middlewares: [body-limit-2m, strip-remotes-activity]
      priority: 50
    shell:
      rule: "PathPrefix(\`/\`)"
      service: shell
      priority: 1

  services:
    remote-activity:
      loadBalancer:
        servers: [{ url: "http://remote-activity:4002" }]
    shell:
      loadBalancer:
        servers: [{ url: "http://shell:3000" }]
`;

describe('patchCompose', () => {
  it('inserts the service block before the top-level volumes key (not the nested one)', () => {
    const out = patchCompose(COMPOSE, names, 4003);
    expect(out).toContain('  remote-inventory:');
    expect(out).toContain('"${REMOTE_INVENTORY_PORT:-4003}:4003" # fixed container port (conventions/05)');
    expect(out).toContain('app/remotes/inventory/Dockerfile');
    expect(out).toContain('http://127.0.0.1:4003/remoteEntry.js');
    const blockIdx = out.indexOf('  remote-inventory:');
    // anchor is the column-0 volumes key — the nested 4-space postgres volumes
    // key must stay untouched (block landing there = 6-space nested service)
    const topLevelVolumes = out.indexOf('\nvolumes:');
    const nestedVolumes = out.indexOf('    volumes:');
    expect(blockIdx).toBeGreaterThan(nestedVolumes);
    expect(blockIdx).toBeLessThan(topLevelVolumes);
    expect(out).toContain('    volumes:\n      - pgdata:/var/lib/postgresql/data');
    // existing services untouched, volumes section preserved
    expect(out).toContain('  remote-activity:');
    expect(out.trimEnd().endsWith('pgdata:')).toBe(true);
  });

  it('appends at EOF when the stack has no volumes section', () => {
    const noVolumes = COMPOSE.slice(0, COMPOSE.indexOf('\nvolumes:'));
    const out = patchCompose(noVolumes, names, 4100);
    expect(out).toContain('  remote-inventory:');
    expect(out).toContain('${REMOTE_INVENTORY_PORT:-4100}:4100');
  });
});

describe('patchNginxGateway', () => {
  it('adds the map entry BEFORE the default line (not before default_type)', () => {
    const out = patchNginxGateway(NGINX, names, 4003);
    const invIdx = out.indexOf('~^/remotes/inventory/');
    const defaultTypeIdx = out.indexOf('default_type');
    const defaultIdx = out.indexOf('default              "http://shell:3000";');
    expect(invIdx).toBeGreaterThan(defaultTypeIdx); // default_type untouched, stays first
    expect(invIdx).toBeGreaterThan(-1);
    expect(invIdx).toBeLessThan(defaultIdx);
    expect(out).toContain('"http://remote-inventory:4003";');
  });

  it('returns the text unchanged when the map block is missing', () => {
    expect(patchNginxGateway('nothing here', names, 4003)).toBe('nothing here');
  });
});

describe('patchTraefik', () => {
  it('adds middleware, router and service blocks', () => {
    const out = patchTraefik(TRAEFIK, names, 4003);
    expect(out).toContain('    strip-remotes-inventory:\n      stripPrefix:\n        prefixes: ["/remotes/inventory"]');
    expect(out).toContain('    remotes-inventory:\n      rule: "PathPrefix(`/remotes/inventory`)"');
    expect(out).toContain('      middlewares: [body-limit-2m, strip-remotes-inventory]');
    expect(out).toContain('    remote-inventory:\n      loadBalancer:\n        servers: [{ url: "http://remote-inventory:4003" }]');
    // router/service stay before the shell catch-all; existing blocks intact
    expect(out.indexOf('remotes-inventory:')).toBeLessThan(out.indexOf('    shell:'));
    expect(out).toContain('strip-remotes-activity');
  });
});

describe('shell registry patches', () => {
  it('remote-urls.ts gains the new key after activity', () => {
    const src = `export function registerBuildtimeRemoteUrls(): void {
  (globalThis as Record<string, unknown>)['__REMOTE_URLS__'] = {
    tasks: __REMOTE_TASKS_URL__,
    activity: __REMOTE_ACTIVITY_URL__,
  };
}`;
    const out = patchShellRemoteUrls(src, names);
    expect(out).toContain('    inventory: __REMOTE_INVENTORY_URL__,\n  };');
  });

  it('env.d.ts gains the declare const', () => {
    const out = patchShellEnvTypes('declare const __REMOTE_ACTIVITY_URL__: string;\n', names);
    expect(out).toBe(
      'declare const __REMOTE_ACTIVITY_URL__: string;\ndeclare const __REMOTE_INVENTORY_URL__: string;\n',
    );
  });

  it('rspack config gains const + DefinePlugin entry + remotes entry', () => {
    const src = [
      "const remoteActivityUrl = process.env.REMOTE_ACTIVITY_URL || '/remotes/activity/remoteEntry.js';",
      '      __REMOTE_ACTIVITY_URL__: JSON.stringify(remoteActivityUrl),',
      '        activity: `activity@${remoteActivityUrl}`,',
    ].join('\n');
    const out = patchShellRspack(src, names);
    expect(out).toContain("const remoteInventoryUrl = process.env.REMOTE_INVENTORY_URL || '/remotes/inventory/remoteEntry.js';");
    expect(out).toContain('      __REMOTE_INVENTORY_URL__: JSON.stringify(remoteInventoryUrl),');
    expect(out).toContain('        inventory: `inventory@${remoteInventoryUrl}`,');
  });

  it('vitest config gains the build-time define stub', () => {
    const src = `    __REMOTE_ACTIVITY_URL__: "'http://buildtime:4002/remoteEntry.js'",\n`;
    const out = patchShellVitest(src, names, 4003);
    expect(out).toContain(`    __REMOTE_INVENTORY_URL__: "'http://buildtime:4003/remoteEntry.js'",`);
  });

  it('missing anchors leave the text unchanged (drifted stack)', () => {
    expect(patchShellRemoteUrls('drifted', names)).toBe('drifted');
    expect(patchShellRspack('drifted', names)).toBe('drifted');
    expect(patchShellVitest('drifted', names, 4003)).toBe('drifted');
    expect(patchShellEnvTypes('drifted', names)).toBe('drifted');
  });
});

describe('patchEnvExample', () => {
  const ENV = `GATEWAY_PORT=8080
REMOTE_TASKS_PORT=4001
REMOTE_ACTIVITY_PORT=4002
NODE_SVC_PORT=3001
REMOTE_TASKS_URL=http://remote-tasks:4001
REMOTE_ACTIVITY_URL=http://remote-activity:4002
CORS_DEV_ORIGIN=http://localhost:3000,http://localhost:4001,http://localhost:4002
`;

  it('adds port + URL lines and extends CORS_DEV_ORIGIN', () => {
    const out = patchEnvExample(ENV, names, 4003);
    expect(out).toContain('REMOTE_INVENTORY_PORT=4003\nNODE_SVC_PORT=3001');
    expect(out).toContain('REMOTE_INVENTORY_URL=http://remote-inventory:4003');
    expect(out).toContain(
      'CORS_DEV_ORIGIN=http://localhost:3000,http://localhost:4001,http://localhost:4002,http://localhost:4003',
    );
  });

  it('falls back to the REMOTE_TASKS_* anchors when activity was pruned', () => {
    const pruned = ENV.split('\n')
      .filter((line) => !line.includes('ACTIVITY'))
      .join('\n');
    const out = patchEnvExample(pruned, names, 4003);
    expect(out).toContain('REMOTE_INVENTORY_PORT=4003\nNODE_SVC_PORT=3001');
    expect(out).toContain('REMOTE_INVENTORY_URL=http://remote-inventory:4003');
  });

  it('does not duplicate the CORS origin when the port is already listed', () => {
    const withPort = ENV.replace(
      'CORS_DEV_ORIGIN=',
      'CORS_DEV_ORIGIN=http://localhost:4003,',
    );
    const out = patchEnvExample(withPort, names, 4003);
    expect(out.match(/4003/g)?.length).toBe(3); // port line + URL line + existing CORS entry
  });
});
