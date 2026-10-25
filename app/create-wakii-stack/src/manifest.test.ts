// Tests manifest — load + validate schema (lỗi rõ từng trường).
import { describe, expect, it } from 'vitest';
import { validateManifest } from './manifest.js';

const VALID = {
  version: 1,
  services: {
    postgres: { layer: 'core' },
    'node-svc': { layer: 'be', paths: ['services/node-svc'], envKeys: ['NODE_SVC_DB_PASSWORD'] },
  },
  files: { compose: 'platform/docker-compose.yml', env: 'platform/.env.example' },
  ports: { gateway: 'http://localhost:8080' },
  smoke: 'bash smoke.sh',
};

describe('validateManifest', () => {
  it('manifest hợp lệ → parse đủ fields (services/files/ports/smoke)', () => {
    const m = validateManifest(VALID);
    expect(m.version).toBe(1);
    expect(m.services['node-svc']).toEqual(VALID.services['node-svc']);
    expect(m.files.compose).toBe('platform/docker-compose.yml');
    expect(m.files.env).toBe('platform/.env.example');
    expect(m.ports?.gateway).toBe('http://localhost:8080');
    expect(m.smoke).toBe('bash smoke.sh');
  });

  it('services rỗng → throw', () => {
    expect(() => validateManifest({ ...VALID, services: {} })).toThrow(/services không được rỗng/);
  });

  it('layer lạ → throw liệt kê hợp lệ', () => {
    expect(() => validateManifest({ ...VALID, services: { x: { layer: 'magic' } } })).toThrow(/layer phải thuộc/);
  });

  it('files optional → default layout; version sai → throw', () => {
    const m = validateManifest({ ...VALID, files: undefined });
    expect(m.files.compose).toBe('platform/docker-compose.yml');
    expect(m.files.gatewayConf).toBe('platform/gateway/nginx/nginx.conf');
    expect(() => validateManifest({ ...VALID, files: { compose: 'a', env: 1 } })).toThrow(/files\.env phải là string/);
    expect(() => validateManifest({ ...VALID, version: 2 })).toThrow(/version phải là 1/);
    expect(() => validateManifest('not-an-object')).toThrow(/phải là object/);
  });
  it('services dạng LIST (manifest thật M#8): id/type/paths + fe-no-compose → fe', () => {
    const m = validateManifest({
      version: 1,
      services: [
        { id: 'postgres', type: 'infra', paths: ['platform/postgres/**'] },
        { id: 'admin', type: 'fe-no-compose' },
      ],
    });
    expect(m.services.postgres.layer).toBe('infra');
    expect(m.services.admin.layer).toBe('fe');
  });
});
