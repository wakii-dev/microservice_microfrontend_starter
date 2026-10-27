// UiKitProvider per-mode tests (theming 2) — theme { light, dark } → provider TỰ
// theo attr data-bp-theme của TỔ TIÊN: đọc lúc mount + MutationObserver khi attr
// đổi (jsdom có MutationObserver — cùng luồng chart-theme.test: act setAttribute +
// waitFor). jsdom không áp CSS → assert attr + style var trên scope div.
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { UiKitProvider } from './index';

// 2 mode khác brand + mỗi mode 1 key riêng (canvas chỉ-light, s2 chỉ-dark) — soi
// "CHỈ modes[mode]" (không merge 2 mode vào 1 style).
const MODES = {
  light: { accent: '#7c3aed', accentHi: '#a78bfa', canvas: '#fdf6e3' },
  dark: { accent: '#22d3ee', accentHi: '#67e8f9', s2: '#0f1011' },
};

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-bp-theme');
  document.body.removeAttribute('data-bp-theme');
});

describe('UiKitProvider theme modes (per-mode)', () => {
  it('tổ tiên light (không attr) → scope KHÔNG attr + chỉ light-vars', () => {
    const { container } = render(
      <UiKitProvider theme={MODES}>
        <span>x</span>
      </UiKitProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope).not.toHaveAttribute('data-bp-theme');
    expect(scope.style.getPropertyValue('--accent')).toBe('#7c3aed');
    expect(scope.style.getPropertyValue('--accent-hi')).toBe('#a78bfa');
    expect(scope.style.getPropertyValue('--c-canvas')).toBe('#fdf6e3');
    // key của mode dark không lộ lúc light
    expect(scope.style.getPropertyValue('--c-s2')).toBe('');
  });

  it('tổ tiên đã dark lúc mount → scope attr "dark" + dark-vars (không light-vars)', () => {
    const { container } = render(
      <div data-bp-theme="dark">
        <UiKitProvider theme={MODES}>
          <span>x</span>
        </UiKitProvider>
      </div>,
    );
    const scope = (container.firstElementChild as HTMLElement).firstElementChild as HTMLElement;
    expect(scope).toHaveAttribute('data-bp-theme', 'dark');
    expect(scope.style.getPropertyValue('--accent')).toBe('#22d3ee');
    expect(scope.style.getPropertyValue('--accent-hi')).toBe('#67e8f9');
    expect(scope.style.getPropertyValue('--c-s2')).toBe('#0f1011');
    // key của mode light không set lên scope lúc dark (cascade tự lo phần còn lại)
    expect(scope.style.getPropertyValue('--c-canvas')).toBe('');
  });

  it('attr trên <html> (host đặt documentElement) lúc mount → chọn dark-vars', () => {
    document.documentElement.setAttribute('data-bp-theme', 'dark');
    const { container } = render(
      <UiKitProvider theme={MODES}>
        <span>x</span>
      </UiKitProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope).toHaveAttribute('data-bp-theme', 'dark');
    expect(scope.style.getPropertyValue('--accent')).toBe('#22d3ee');
  });

  it('toggle attr tổ tiên light→dark→light runtime → attr + vars đổi theo (live)', async () => {
    const { container } = render(
      <div data-testid="host">
        <UiKitProvider theme={MODES}>
          <span>x</span>
        </UiKitProvider>
      </div>,
    );
    const host = screen.getByTestId('host');
    const scope = host.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue('--accent')).toBe('#7c3aed');
    expect(scope).not.toHaveAttribute('data-bp-theme');

    await act(async () => {
      host.setAttribute('data-bp-theme', 'dark');
    });
    await waitFor(() => {
      expect(scope).toHaveAttribute('data-bp-theme', 'dark');
      expect(scope.style.getPropertyValue('--accent')).toBe('#22d3ee');
      expect(scope.style.getPropertyValue('--c-s2')).toBe('#0f1011');
    });

    await act(async () => {
      host.setAttribute('data-bp-theme', 'light');
    });
    await waitFor(() => {
      expect(scope).not.toHaveAttribute('data-bp-theme');
      expect(scope.style.getPropertyValue('--accent')).toBe('#7c3aed');
      expect(scope.style.getPropertyValue('--c-canvas')).toBe('#fdf6e3');
    });
  });

  it('toggle attr trên <html> runtime → modes re-read (html path)', async () => {
    const { container } = render(
      <UiKitProvider theme={MODES}>
        <span>x</span>
      </UiKitProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue('--accent')).toBe('#7c3aed');
    await act(async () => {
      document.documentElement.setAttribute('data-bp-theme', 'dark');
    });
    await waitFor(() => {
      expect(scope).toHaveAttribute('data-bp-theme', 'dark');
      expect(scope.style.getPropertyValue('--accent')).toBe('#22d3ee');
    });
  });

  it('modes chỉ có dark → light: không vars không attr; dark: attr + dark-vars', () => {
    const { container } = render(
      <UiKitProvider theme={{ dark: { accent: '#22d3ee' } }}>
        <span>x</span>
      </UiKitProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope).not.toHaveAttribute('data-bp-theme');
    expect(scope).not.toHaveAttribute('style');

    const { container: container2 } = render(
      <div data-bp-theme="dark">
        <UiKitProvider theme={{ dark: { accent: '#22d3ee' } }}>
          <span>y</span>
        </UiKitProvider>
      </div>,
    );
    const scope2 = (container2.firstElementChild as HTMLElement).firstElementChild as HTMLElement;
    expect(scope2).toHaveAttribute('data-bp-theme', 'dark');
    expect(scope2.style.getPropertyValue('--accent')).toBe('#22d3ee');
  });

  it('legacy accent props vẫn áp, modes[mode] thắng key trùng', () => {
    const { container } = render(
      <UiKitProvider accent="#ff0000" theme={{ light: { accent: '#7c3aed' }, dark: { accent: '#22d3ee' } }}>
        <span>x</span>
      </UiKitProvider>,
    );
    const scope = container.firstElementChild as HTMLElement;
    expect(scope.style.getPropertyValue('--accent')).toBe('#7c3aed');
  });

  it('theme modes nested: con theo mode tổ tiên, ghi đè đúng var của mình', () => {
    const { container } = render(
      <div data-bp-theme="dark">
        <UiKitProvider theme={MODES}>
          <UiKitProvider theme={{ dark: { accent: '#e11d48' } }}>
            <span data-testid="inner">i</span>
          </UiKitProvider>
        </UiKitProvider>
      </div>,
    );
    const outer = (container.firstElementChild as HTMLElement).firstElementChild as HTMLElement;
    const inner = (outer.querySelector('[data-testid="inner"]') as HTMLElement)
      .parentElement as HTMLElement;
    expect(inner).toHaveAttribute('data-bp-theme', 'dark'); // con đọc attr tổ tiên (cha dark)
    expect(inner.style.getPropertyValue('--accent')).toBe('#e11d48');
    expect(outer.style.getPropertyValue('--accent')).toBe('#22d3ee');
  });
});
