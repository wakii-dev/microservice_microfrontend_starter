import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../src/App';

// A11y baseline (spec slice mục 6 — CÓ TEST): skip link + route focus management.

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('a11y baseline', () => {
  it('có skip link trỏ tới #main-content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    const skipLink = screen.getByRole('link', { name: 'Tới nội dung chính' });
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('main content tồn tại với id khớp skip link', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });

  it('đổi route → focus chuyển vào main content (route focus management)', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    // Login fixture user trước (route /tasks RequireAuth) — set token thẳng localStorage.
    // Landing có footer + nav cùng tên link → nav là link đầu trong DOM.
    window.localStorage.setItem('bp.jwt', makeFakeToken());
    const [tasksLink] = screen.getAllByRole('link', { name: 'Tasks' });
    await user.click(tasksLink!);
    await expect.poll(() => document.activeElement?.id, { timeout: 2000 }).toBe('main-content');
  });
});

/** JWT fake đủ 3 segment để readClaims decode (test-only — không qua BE). */
function makeFakeToken(): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64({ sub: 'u1', email: 't@t', roles: [], exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}
