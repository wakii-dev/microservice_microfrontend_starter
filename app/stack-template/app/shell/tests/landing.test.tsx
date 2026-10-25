// Landing showcase smoke (redesign 2026-10-25): hero + bento + marquee + demo
// access render đúng — contract nội dung, không assert animation (jsdom).
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../src/App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('Landing showcase (HomePage redesign)', () => {
  it('hero: h1 + CTA links trỏ /tasks và /activity', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: 'Ship full-stack, not tooling' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore tasks' })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: 'View activity' })).toHaveAttribute('href', '/activity');
  });

  it('bento: capabilities section + gallery carousel 3 ảnh + mini chart', () => {
    renderHome();
    expect(screen.getByRole('region', { name: 'Capabilities' })).toBeInTheDocument();
    expect(screen.getAllByAltText(/Showcase visual/).length).toBe(3);
    expect(screen.getByText('E2E convergence')).toBeInTheDocument();
    expect(screen.getByText('By the numbers')).toBeInTheDocument();
  });

  it('marquee tech-stack: nội dung nhân đôi ×2 (loop liền mạch)', () => {
    renderHome();
    expect(screen.getAllByText('Module Federation').length).toBe(2);
    expect(screen.getAllByText('framer-motion').length).toBe(2);
  });

  it('demo access giữ contract: alice@demo.local + fail@demo.local đọc được', () => {
    renderHome();
    expect(screen.getByText(/alice@demo\.local/)).toBeInTheDocument();
    expect(screen.getByText(/fail@demo\.local/)).toBeInTheDocument();
  });

  it('stack section: terminal + 4 tầng kiến trúc render', () => {
    renderHome();
    expect(screen.getByRole('img', { name: 'Terminal boot sequence demo' })).toBeInTheDocument();
    for (const tier of ['Experience', 'Edge', 'Services', 'Infra']) {
      expect(screen.getByText(tier)).toBeInTheDocument();
    }
  });

  it('hero Scene3D: jsdom thiếu WebGL → fallback blob, headline không vỡ', async () => {
    renderHome();
    // Scene3D box nằm trong wrapper aria-hidden (nền trang trí) → role query bỏ qua;
    // waitFor box lazy-chunk mount, rồi assert fallback blob bên trong (jsdom không WebGL)
    await waitFor(() => {
      expect(document.querySelector('div[aria-label*="Cảnh không gian 3D"]')).not.toBeNull();
    });
    await screen.findByTestId('hero-scene-fallback');
    expect(screen.getByRole('heading', { name: 'Ship full-stack, not tooling' })).toBeInTheDocument();
  });
});
