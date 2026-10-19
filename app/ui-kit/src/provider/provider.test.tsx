// UiKitProvider tests — theme attr + accent var + nested override.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Badge } from '../ui/badge/index';
import { UiKitProvider } from './index';

afterEach(cleanup);

describe('UiKitProvider', () => {
  it('mặc định light → KHÔNG data-bp-theme', () => {
    const { container } = render(
      <UiKitProvider>
        <span>x</span>
      </UiKitProvider>,
    );
    expect(container.firstElementChild).not.toHaveAttribute('data-bp-theme');
  });

  it('theme dark → data-bp-theme="dark" (dark.css scope ăn)', () => {
    const { container } = render(
      <UiKitProvider theme="dark">
        <span>x</span>
      </UiKitProvider>,
    );
    expect(container.firstElementChild).toHaveAttribute('data-bp-theme', 'dark');
  });

  it('accent → inline var --accent trên scope (CSS cascade xuống con)', () => {
    const { container } = render(
      <UiKitProvider accent="#ff0000" accentHover="#cc0000">
        <Badge variant="created">created</Badge>
      </UiKitProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue('--accent')).toBe('#ff0000');
    expect(scope.style.getPropertyValue('--accent-hi')).toBe('#cc0000');
  });

  it('nested: provider con ghi đè accent cha (CSS cascade)', () => {
    const { container } = render(
      <UiKitProvider accent="#111111">
        <UiKitProvider accent="#222222">
          <span data-testid="inner">i</span>
        </UiKitProvider>
      </UiKitProvider>,
    );
    const outer = container.firstElementChild as HTMLElement;
    const inner = outer.querySelector('[data-testid="inner"]')!.parentElement as HTMLElement;
    expect(inner.style.getPropertyValue('--accent')).toBe('#222222');
    expect(outer.style.getPropertyValue('--accent')).toBe('#111111');
  });

  it('không truyền theme → KHÔNG style attr (behavior cũ)', () => {
    const { container } = render(
      <UiKitProvider>
        <span>x</span>
      </UiKitProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope).not.toHaveAttribute('style');
  });

  it('theme object → đủ cặp var/value đúng map (--c-canvas, --accent, --st-done…)', () => {
    const { container } = render(
      <UiKitProvider
        theme={{
          canvas: '#fdf6e3',
          s2: '#fffdf8',
          accent: '#7c3aed',
          accentHi: '#a78bfa',
          ink: '#1f2937',
          done: '#16a34a',
          doing: '#f59e0b',
          fail: '#dc2626',
          line: '#e7e5e4',
        }}
      >
        <span>x</span>
      </UiKitProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue('--c-canvas')).toBe('#fdf6e3');
    expect(scope.style.getPropertyValue('--c-s2')).toBe('#fffdf8');
    expect(scope.style.getPropertyValue('--accent')).toBe('#7c3aed');
    expect(scope.style.getPropertyValue('--accent-hi')).toBe('#a78bfa');
    expect(scope.style.getPropertyValue('--ink')).toBe('#1f2937');
    expect(scope.style.getPropertyValue('--st-done')).toBe('#16a34a');
    expect(scope.style.getPropertyValue('--st-doing')).toBe('#f59e0b');
    expect(scope.style.getPropertyValue('--st-fail')).toBe('#dc2626');
    expect(scope.style.getPropertyValue('--line')).toBe('#e7e5e4');
    // không data attr — object theme không bật dark scope
    expect(scope).not.toHaveAttribute('data-bp-theme');
  });

  it('theme object trùng key legacy accent → object thắng; key còn lại vẫn set', () => {
    const { container } = render(
      <UiKitProvider accent="#ff0000" theme={{ accent: '#7c3aed', ink: '#1f2937' }}>
        <span>x</span>
      </UiKitProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue('--accent')).toBe('#7c3aed');
    expect(scope.style.getPropertyValue('--ink')).toBe('#1f2937');
  });

  it('theme object nested: con ghi đè đúng var, cha giữ var của mình', () => {
    const { container } = render(
      <UiKitProvider theme={{ accent: '#111111', canvas: '#ffffff' }}>
        <UiKitProvider theme={{ accent: '#222222' }}>
          <span data-testid="inner">i</span>
        </UiKitProvider>
      </UiKitProvider>,
    );
    const outer = container.firstElementChild as HTMLElement;
    const inner = outer.querySelector('[data-testid="inner"]')!.parentElement as HTMLElement;
    expect(inner.style.getPropertyValue('--accent')).toBe('#222222');
    expect(inner.style.getPropertyValue('--c-canvas')).toBe(''); // con không set → không style local
    expect(outer.style.getPropertyValue('--accent')).toBe('#111111');
    expect(outer.style.getPropertyValue('--c-canvas')).toBe('#ffffff');
  });
});
