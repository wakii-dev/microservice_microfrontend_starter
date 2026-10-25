// Tests options — flags + defaults + invalid (spec: parse flags, defaults, invalid).
import { describe, expect, it } from 'vitest';
import { parseArgs, resolveOptions } from './options.js';

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
  it('đổ default: appName my-wakii-app, router true; giá trị chỉ định thắng', () => {
    expect(resolveOptions({ lang: 'ts', extras: [], yes: true, skipInstall: false })).toEqual({
      appName: 'my-wakii-app',
      lang: 'ts',
      router: true,
      extras: [],
      skipInstall: false,
    });
    // extras kéo theo router; tắt router tường minh + extras → lỗi rõ
    expect(resolveOptions({ appName: 'x', lang: 'js', router: true, extras: ['chart'], yes: false, skipInstall: true })).toEqual({
      appName: 'x', lang: 'js', router: true, extras: ['chart'], skipInstall: true,
    });
    expect(() => resolveOptions({ lang: 'ts', router: false, extras: ['chart'], yes: true, skipInstall: false })).toThrow(/mâu thuẫn/);
  });
});
