// Tests options — flags + defaults + invalid (spec: parse flags, defaults, invalid).
import { describe, expect, it } from 'vitest';
import { parseArgs, resolveOptions, toRemoteName } from './options.js';

describe('parseArgs — preset', () => {
  it('--preset product (tách) và --preset=product (dấu =) đều nhận', () => {
    expect(parseArgs(['--preset', 'product'])).toMatchObject({ ok: true, options: { preset: 'product' } });
    expect(parseArgs(['--preset=admin'])).toMatchObject({ ok: true, options: { preset: 'admin' } });
  });

  it('không --preset → undefined (CLI prompt; resolveOptions đổ default demo)', () => {
    const r = parseArgs([]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.options.preset).toBeUndefined();
  });

  it('--preset xyz → lỗi rõ liệt kê 5 preset', () => {
    const r = parseArgs(['--preset', 'xyz']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('--preset chỉ nhận: demo | minimal | product | admin | landing');
    expect(parseArgs(['--preset']).ok).toBe(false);
  });
});

describe('parseArgs', () => {
  it('rỗng → defaults (lang ts, extras [], router/appName undefined để prompt)', () => {
    const r = parseArgs([]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.options).toMatchObject({ lang: 'ts', extras: [], yes: false, skipInstall: false });
      expect(r.options.appName).toBeUndefined();
      expect(r.options.router).toBeUndefined();
    }
  });

  it('positional → appName; --yes → yes', () => {
    const r = parseArgs(['my-app', '--yes']);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.options.appName).toBe('my-app');
      expect(r.options.yes).toBe(true);
    }
  });

  it('--lang js (dạng tách) và --lang=js (dấu =) đều nhận', () => {
    expect(parseArgs(['--lang', 'js'])).toMatchObject({ ok: true, options: { lang: 'js' } });
    expect(parseArgs(['--lang=js'])).toMatchObject({ ok: true, options: { lang: 'js' } });
  });

  it('--lang py → lỗi rõ', () => {
    const r = parseArgs(['--lang', 'py']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("--lang chỉ nhận 'ts' | 'js'");
  });

  it('--router / --no-router set tri-state', () => {
    expect(parseArgs(['--router'])).toMatchObject({ ok: true, options: { router: true } });
    expect(parseArgs(['--no-router'])).toMatchObject({ ok: true, options: { router: false } });
  });

  it('--extras chart,carousel → parse + dedupe; --extras=chart dạng =; extra lạ → lỗi', () => {
    expect(parseArgs(['--extras', 'chart,carousel'])).toMatchObject({
      ok: true,
      options: { extras: ['chart', 'carousel'], extrasProvided: true },
    });
    expect(parseArgs(['--extras=chart,chart'])).toMatchObject({
      ok: true,
      options: { extras: ['chart'] },
    });
    const bad = parseArgs(['--extras', 'redux']);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toContain("Extra không hỗ trợ: 'redux'");
  });

  it('flag lạ → lỗi; 2 positional → lỗi; --skip-install + -h nhận', () => {
    expect(parseArgs(['--bogus']).ok).toBe(false);
    expect(parseArgs(['a', 'b']).ok).toBe(false);
    expect(parseArgs(['--skip-install', '-h'])).toMatchObject({
      ok: true,
      options: { skipInstall: true, help: true },
    });
  });
});

describe('resolveOptions', () => {
  it('đổ default: appName my-wakii-app, router true, preset demo; giá trị chỉ định thắng', () => {
    expect(resolveOptions({ lang: 'ts', extras: [], yes: true, skipInstall: false })).toEqual({
      appName: 'my-wakii-app',
      lang: 'ts',
      router: true,
      extras: [],
      preset: 'demo',
      variant: 'vite',
      asRemote: false,
      skipInstall: false,
      dryRun: false,
    });
    // extras kéo theo router; tắt router tường minh + extras → lỗi rõ
    expect(resolveOptions({ appName: 'x', lang: 'js', router: true, extras: ['chart'], yes: false, skipInstall: true })).toEqual({
      appName: 'x', lang: 'js', router: true, extras: ['chart'], preset: 'demo', variant: 'vite', asRemote: false, skipInstall: true, dryRun: false,
    });
    expect(() => resolveOptions({ lang: 'ts', router: false, extras: ['chart'], yes: true, skipInstall: false })).toThrow(/mâu thuẫn/);
  });

  it('preset khác demo: router luôn true (bỏ qua prompt); giá trị preset giữ nguyên', () => {
    expect(resolveOptions({ lang: 'ts', preset: 'product', extras: [], yes: true, skipInstall: false })).toMatchObject({
      preset: 'product',
      router: true,
      lang: 'ts',
    });
    expect(resolveOptions({ lang: 'ts', preset: 'minimal', router: false, extras: [], yes: true, skipInstall: false })).toMatchObject({
      preset: 'minimal',
      router: true, // --no-router bị bỏ qua với non-demo (template có sẵn)
    });
  });

  it('preset khác demo + --extras → lỗi "extras chỉ dành cho preset demo"', () => {
    expect(() => resolveOptions({ lang: 'ts', preset: 'product', extras: ['chart'], yes: true, skipInstall: false })).toThrow(
      /extras chỉ dành cho preset demo/,
    );
  });

  it('preset product/admin + --lang js → lỗi "chỉ hỗ trợ TypeScript" (minimal/landing có bản js riêng)', () => {
    expect(() => resolveOptions({ lang: 'js', preset: 'product', extras: [], yes: true, skipInstall: false })).toThrow(
      /chỉ hỗ trợ TypeScript/,
    );
    expect(() => resolveOptions({ lang: 'js', preset: 'admin', extras: [], yes: true, skipInstall: false })).toThrow(
      /chỉ hỗ trợ TypeScript/,
    );
  });

  it('preset minimal + --lang js → OK (bản minimal-js), router vẫn true', () => {
    expect(resolveOptions({ lang: 'js', preset: 'minimal', extras: [], yes: true, skipInstall: false })).toMatchObject({
      preset: 'minimal',
      lang: 'js',
      router: true,
    });
  });
});

describe('resolveOptions — preset landing', () => {
  it('--preset landing parse + resolve như non-demo: router true (bỏ qua --no-router)', () => {
    expect(parseArgs(['--preset=landing'])).toMatchObject({ ok: true, options: { preset: 'landing' } });
    expect(resolveOptions({ lang: 'ts', preset: 'landing', extras: [], yes: true, skipInstall: false })).toMatchObject({
      preset: 'landing',
      router: true,
      lang: 'ts',
    });
    expect(resolveOptions({ lang: 'ts', preset: 'landing', router: false, extras: [], yes: true, skipInstall: false })).toMatchObject({
      preset: 'landing',
      router: true,
    });
  });

  it('landing + --extras → lỗi "extras chỉ dành cho preset demo"', () => {
    expect(() => resolveOptions({ lang: 'ts', preset: 'landing', extras: ['chart'], yes: true, skipInstall: false })).toThrow(
      /extras chỉ dành cho preset demo/,
    );
  });

  it('landing + --lang js → OK (bản landing-js), router vẫn true', () => {
    expect(resolveOptions({ lang: 'js', preset: 'landing', extras: [], yes: true, skipInstall: false })).toMatchObject({
      preset: 'landing',
      lang: 'js',
      router: true,
    });
  });

  it('landing + --variant next → lỗi "variant chỉ dành cho preset demo"', () => {
    expect(() => resolveOptions({ lang: 'ts', preset: 'landing', extras: [], yes: true, skipInstall: false, variant: 'next' })).toThrow(
      /variant next chỉ dành cho preset demo/,
    );
  });
});

describe('resolveOptions — variant framework', () => {
  it('--variant next parse + default vite', () => {
    const vr = parseArgs(['--variant', 'next']);
    if (vr.ok) expect(vr.options.variant).toBe('next');
    expect(parseArgs(['--variant', 'nuxt']).ok).toBe(false);
    const plan = resolveOptions({ lang: 'ts', extras: [], yes: false, skipInstall: false, variant: 'next' });
    expect(plan.variant).toBe('next');
    expect(resolveOptions({ lang: 'ts', extras: [], yes: false, skipInstall: false }).variant).toBe('vite');
  });
  it('variant != vite conflict preset/extras/js → lỗi rõ', () => {
    expect(() => resolveOptions({ lang: 'ts', extras: [], yes: false, skipInstall: false, variant: 'astro', preset: 'product' })).toThrow(/chỉ dành cho preset demo/);
    expect(() => resolveOptions({ lang: 'js', extras: [], yes: false, skipInstall: false, variant: 'astro' })).toThrow(/chỉ hỗ trợ TypeScript/);
    expect(() => resolveOptions({ lang: 'ts', extras: ['chart'], yes: false, skipInstall: false, variant: 'astro' })).toThrow(/chỉ dành cho variant vite/);
  });
});

describe('dry-run', () => {
  it('--dry-run parse + default false', () => {
    const r = parseArgs(['--dry-run']);
    if (r.ok) expect(r.options.dryRun).toBe(true);
    expect(resolveOptions({ lang: 'ts', extras: [], yes: true, skipInstall: false, dryRun: true }).dryRun).toBe(true);
    expect(resolveOptions({ lang: 'ts', extras: [], yes: true, skipInstall: false }).dryRun).toBe(false);
  });
});

describe('parseArgs — as-remote', () => {
  it('--as-remote sets the boolean flag; absent → undefined (no prompt path)', () => {
    expect(parseArgs(['my-remote', '--as-remote'])).toMatchObject({
      ok: true,
      options: { asRemote: true, appName: 'my-remote' },
    });
    const r = parseArgs([]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.options.asRemote).toBeUndefined();
  });
});

describe('resolveOptions — as-remote', () => {
  it('defaults: preset demo forced, router NOT applied (false), lang ts, asRemote true', () => {
    expect(resolveOptions({ appName: 'my-remote', lang: 'ts', extras: [], yes: true, skipInstall: false, asRemote: true })).toEqual({
      appName: 'my-remote',
      lang: 'ts',
      router: false,
      extras: [],
      preset: 'demo',
      variant: 'vite',
      asRemote: true,
      skipInstall: false,
      dryRun: false,
    });
    // explicit --router is IGNORED — remote-ts ships no router
    expect(resolveOptions({ lang: 'ts', router: true, extras: [], yes: true, skipInstall: false, asRemote: true })).toMatchObject({
      router: false,
      asRemote: true,
    });
  });

  it('conflicts → clear errors (preset ≠ demo, variant ≠ vite, lang js, extras)', () => {
    expect(() => resolveOptions({ lang: 'ts', preset: 'product', extras: [], yes: true, skipInstall: false, asRemote: true })).toThrow(
      /--as-remote cannot be combined with --preset/,
    );
    expect(() => resolveOptions({ lang: 'ts', extras: [], yes: true, skipInstall: false, asRemote: true, variant: 'next' })).toThrow(
      /--as-remote cannot be combined with --variant next/,
    );
    expect(() => resolveOptions({ lang: 'js', extras: [], yes: true, skipInstall: false, asRemote: true })).toThrow(
      /--as-remote currently supports TypeScript only/,
    );
    expect(() => resolveOptions({ lang: 'ts', extras: ['chart'], yes: true, skipInstall: false, asRemote: true })).toThrow(
      /--as-remote cannot be combined with --extras/,
    );
  });
});

describe('toRemoteName — MF container name (identifier-safe)', () => {
  it('kebab/snake/space → PascalCase; leading digits stripped; empty fallback', () => {
    expect(toRemoteName('remote-check')).toBe('RemoteCheck');
    expect(toRemoteName('my_app')).toBe('MyApp');
    expect(toRemoteName('Admin Panel')).toBe('AdminPanel');
    expect(toRemoteName('3app')).toBe('App');
    expect(toRemoteName('Activity')).toBe('Activity');
    expect(toRemoteName('---')).toBe('Remote');
  });
});
