// useChartTheme tests — F2 dark-toggle live: resolve token theo scope probe +
// re-resolve khi theme attr đổi (trên <html> — path F1, và trên wrapper node
// trong subtree body — path UiKitProvider). jsdom không áp CSS → mock
// getComputedStyle để kiểm luồng resolve/re-resolve.
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useChartTheme } from './index.js';

const VARS = { accent: '--accent', done: '--st-done' } as const;
const FALLBACK = { accent: '#1677ff', done: '#52c41a' };

let accentValue = '';

function Probe({ onColors }: { onColors: (c: Record<string, string>) => void }) {
  const { ref, colors } = useChartTheme(VARS, FALLBACK);
  onColors(colors);
  return <span ref={ref} aria-hidden="true" />;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-bp-theme');
  document.body.removeAttribute('data-bp-theme');
});

describe('useChartTheme (F2 — dark-toggle live)', () => {
  it('token không resolve được (jsdom không áp CSS) → trả fallback nguyên vẹn', () => {
    const seen: Record<string, string>[] = [];
    render(<Probe onColors={(c) => seen.push(c)} />);
    expect(seen.at(-1)).toEqual(FALLBACK);
  });

  it('resolve ngay lúc mount khi probe nằm trong scope có token', async () => {
    accentValue = '#5e6ad2';
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({ getPropertyValue: (n: string) => (n === '--accent' ? accentValue : '') }) as unknown as CSSStyleDeclaration,
    );
    const seen: Record<string, string>[] = [];
    render(<Probe onColors={(c) => seen.push(c)} />);
    expect(seen.at(-1)?.accent).toBe('#5e6ad2');
    expect(seen.at(-1)?.done).toBe(FALLBACK.done); // var không có giá trị → giữ fallback
  });

  it('attr data-bp-theme đổi trên <html> → re-resolve (html path F1)', async () => {
    accentValue = '#5e6ad2';
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({ getPropertyValue: (n: string) => (n === '--accent' ? accentValue : '') }) as unknown as CSSStyleDeclaration,
    );
    const seen: Record<string, string>[] = [];
    render(<Probe onColors={(c) => seen.push(c)} />);
    accentValue = '#828fff';
    await act(async () => {
      document.documentElement.setAttribute('data-bp-theme', 'dark');
    });
    await waitFor(() => expect(seen.at(-1)?.accent).toBe('#828fff'));
  });

  it('attr đổi trên wrapper node trong subtree body → re-resolve (UiKitProvider path)', async () => {
    accentValue = '#1677ff';
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({ getPropertyValue: (n: string) => (n === '--accent' ? accentValue : '') }) as unknown as CSSStyleDeclaration,
    );
    const seen: Record<string, string>[] = [];
    render(
      <div data-testid="theme-scope">
        <Probe onColors={(c) => seen.push(c)} />
      </div>,
    );
    expect(seen.at(-1)?.accent).toBe('#1677ff');
    accentValue = '#5e6ad2';
    await act(async () => {
      screen.getByTestId('theme-scope').setAttribute('data-bp-theme', 'dark');
    });
    await waitFor(() => expect(seen.at(-1)?.accent).toBe('#5e6ad2'));
  });
});
