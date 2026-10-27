// useChartPalette tests — palette public (theming 2): jsdom không áp CSS → trả
// FALLBACK (= token light mặc định) nguyên vẹn; mock getComputedStyle → kiểm đủ
// 13 key map đúng var (stDone→--st-done…); attr theme đổi trên <html> lẫn wrapper
// trong subtree body → palette re-resolve LIVE (pattern chart-theme.test).
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useChartPalette } from './useChartPalette.js';

function Probe({ onPalette }: { onPalette: (p: Record<string, string>) => void }) {
  const { ref, palette } = useChartPalette();
  onPalette(palette);
  return <span ref={ref} aria-hidden="true" />;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-bp-theme');
  document.body.removeAttribute('data-bp-theme');
});

describe('useChartPalette (public theming 2)', () => {
  it('jsdom không áp CSS → trả fallback (token light mặc định) nguyên vẹn', () => {
    const seen: Record<string, string>[] = [];
    render(<Probe onPalette={(p) => seen.push(p)} />);
    expect(seen.at(-1)).toEqual({
      accent: '#1677ff',
      accentHi: '#4096ff',
      ink: 'rgba(0, 0, 0, 0.88)',
      ink2: 'rgba(0, 0, 0, 0.65)',
      ink3: 'rgba(0, 0, 0, 0.45)',
      line: '#e2e5ea',
      canvas: '#f5f5f5',
      s1: '#ffffff',
      s2: '#ffffff',
      s3: '#fafafa',
      stDone: '#52c41a',
      stDoing: '#faad14',
      stFail: '#ff4d4f',
    });
  });

  it('resolve đủ 13 key, map đúng var (stDone→--st-done, canvas→--c-canvas…)', () => {
    // Giá trị dark (dark.css) — mỗi var 1 màu riêng để soi nhầm key ↔ var.
    const RESOLVED: Record<string, string> = {
      '--accent': '#5e6ad2',
      '--accent-hi': '#828fff',
      '--ink': '#f7f8f8',
      '--ink2': '#d0d6e0',
      '--ink3': '#8a8f98',
      '--line': '#23252a',
      '--c-canvas': '#010102',
      '--c-s1': '#0f1011',
      '--c-s2': '#141516',
      '--c-s3': '#18191a',
      '--st-done': '#3fb950',
      '--st-doing': '#f2c94c',
      '--st-fail': '#f06a6a',
    };
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ getPropertyValue: (n: string) => RESOLVED[n] ?? '' }) as unknown as CSSStyleDeclaration,
    );
    const seen: Record<string, string>[] = [];
    render(<Probe onPalette={(p) => seen.push(p)} />);
    expect(seen.at(-1)).toEqual({
      accent: '#5e6ad2',
      accentHi: '#828fff',
      ink: '#f7f8f8',
      ink2: '#d0d6e0',
      ink3: '#8a8f98',
      line: '#23252a',
      canvas: '#010102',
      s1: '#0f1011',
      s2: '#141516',
      s3: '#18191a',
      stDone: '#3fb950',
      stDoing: '#f2c94c',
      stFail: '#f06a6a',
    });
  });

  it('attr data-bp-theme đổi trên <html> → palette re-resolve live (html path)', async () => {
    let accentValue = '#1677ff';
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({ getPropertyValue: (n: string) => (n === '--accent' ? accentValue : '') }) as unknown as CSSStyleDeclaration,
    );
    const seen: Record<string, string>[] = [];
    render(<Probe onPalette={(p) => seen.push(p)} />);
    expect(seen.at(-1)?.accent).toBe('#1677ff');
    accentValue = '#5e6ad2';
    await act(async () => {
      document.documentElement.setAttribute('data-bp-theme', 'dark');
    });
    await waitFor(() => expect(seen.at(-1)?.accent).toBe('#5e6ad2'));
  });

  it('attr đổi trên wrapper node trong subtree body → palette re-resolve (UiKitProvider path)', async () => {
    let accentValue = '#1677ff';
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({ getPropertyValue: (n: string) => (n === '--accent' ? accentValue : '') }) as unknown as CSSStyleDeclaration,
    );
    const seen: Record<string, string>[] = [];
    render(
      <div data-testid="theme-scope">
        <Probe onPalette={(p) => seen.push(p)} />
      </div>,
    );
    expect(seen.at(-1)?.accent).toBe('#1677ff');
    accentValue = '#22d3ee';
    await act(async () => {
      document.querySelector('[data-testid="theme-scope"]')!.setAttribute('data-bp-theme', 'dark');
    });
    await waitFor(() => expect(seen.at(-1)?.accent).toBe('#22d3ee'));
  });
});
