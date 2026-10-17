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
});
