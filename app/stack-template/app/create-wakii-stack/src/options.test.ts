// Tests options — flags + rules tầng 1 (BE/FE kéo theo + rỗng/lạ → lỗi).
import { describe, expect, it } from 'vitest';
import { parseArgs, resolveOptions } from './options.js';

// Manifest giả 3+ service — layer phân luồng đủ cả core/infra/be/fe.
const CTX = {
  validServices: ['postgres', 'kafka', 'gateway', 'auth-svc', 'node-svc', 'spring-svc', 'shell'],
  layerOf: (s: string) =>
    ({ postgres: 'core', kafka: 'infra', gateway: 'core', 'auth-svc': 'core', 'node-svc': 'be', 'spring-svc': 'be', shell: 'fe' })[s] as
      | 'core'
      | 'infra'
      | 'be'
      | 'fe'
      | undefined,
};

describe('parseArgs', () => {
  it('--services list + positional; --all; --yes/--skip-install/-h', () => {
    const r = parseArgs(['stacks/billing', '--services', 'node-svc,shell', '--skip-install']);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.options.appName).toBe('stacks/billing');
      expect(r.options.services).toEqual(['node-svc', 'shell']);
    }
    expect(parseArgs(['--all', '--yes'])).toMatchObject({ ok: true, options: { all: true, yes: true } });
    expect(parseArgs(['-h'])).toMatchObject({ ok: true, options: { help: true } });
  });

  it('--services= dạng =; flag lạ → lỗi; 2 positional → lỗi', () => {
    expect(parseArgs(['--services=shell'])).toMatchObject({ ok: true, options: { services: ['shell'] } });
    expect(parseArgs(['--bogus']).ok).toBe(false);
    expect(parseArgs(['a', 'b']).ok).toBe(false);
    expect(parseArgs(['--services']).ok).toBe(false); // thiếu giá trị
  });
});

describe('resolveOptions — rules tầng 1', () => {
  it('chọn rỗng → lỗi "Chọn ít nhất 1 service"', () => {
    expect(() => resolveOptions({ all: false, yes: false, skipInstall: false }, CTX)).toThrow(/Chọn ít nhất 1 service/);
    expect(() => resolveOptions({ services: [], all: false, yes: false, skipInstall: false }, CTX)).toThrow(/Chọn ít nhất 1 service/);
  });

  it('service lạ → lỗi liệt kê hợp lệ', () => {
    expect(() => resolveOptions({ services: ['redis'], all: false, yes: false, skipInstall: false }, CTX)).toThrow(
      /Service không có trong manifest: redis/,
    );
  });

  it('≥1 BE → tự kèm postgres+kafka+gateway+auth-svc (spring-svc KHÔNG tự kéo)', () => {
    const r = resolveOptions({ services: ['node-svc'], all: false, yes: false, skipInstall: false }, CTX);
    expect(r.services).toEqual(['auth-svc', 'gateway', 'kafka', 'node-svc', 'postgres']);
  });

  it('≥1 FE → tự kèm gateway (không kéo infra/BE)', () => {
    const r = resolveOptions({ services: ['shell'], all: false, yes: false, skipInstall: false }, CTX);
    expect(r.services).toEqual(['gateway', 'shell']);
  });

  it('--all → toàn bộ (sorted); positional dạng path → basename; --skip-install giữ', () => {
    expect(resolveOptions({ all: true, yes: false, skipInstall: false }, CTX).services).toEqual([...CTX.validServices].sort());
    const r = resolveOptions(
      { appName: 'stacks/billing', services: ['shell'], all: false, yes: false, skipInstall: true },
      CTX,
    );
    expect(r.appName).toBe('billing');
    expect(r.skipInstall).toBe(true);
  });
});
