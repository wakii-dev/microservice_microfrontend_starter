import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../src/App';
import { Layout } from '../src/components/Layout';

// Shell chrome (SF-2): nav active state + brand + HomePage dashboard.
// A11y baseline (skip link/focus) đã có a11y.test.tsx — file này chỉ surface mới.

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('NavBar active state', () => {
  it('link của route đang đứng có aria-current="page", link khác không', () => {
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <Layout />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Trang chủ' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Activity' })).not.toHaveAttribute('aria-current');
  });

  it('đổi route → active chuyển theo (Trang chủ active ở "/")', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tasks' })).not.toHaveAttribute('aria-current');
  });

  it('nav hiển thị brand Boilerplate', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    );
    expect(screen.getByText('Boilerplate')).toBeInTheDocument();
  });

  it('token thiếu email claim → nav KHÔNG crash, avatar hiện "?" (review P2)', () => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    window.localStorage.setItem(
      'bp.jwt',
      `${b64({ alg: 'HS256' })}.${b64({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`,
    );
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('nav-user')).toBeInTheDocument();
    expect(screen.getByTestId('nav-user')).toHaveTextContent('?');
  });
});

describe('HomePage dashboard', () => {
  it('giữ h1 "Trang chủ" + quick links Tasks/Activity (card riêng ngoài nav)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Trang chủ' })).toBeInTheDocument();
    // nav + quick-link card = ≥2 link cùng tên (nav link giữ exact name cho test cũ)
    expect(screen.getAllByRole('link', { name: /Tasks/ }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole('link', { name: /Activity/ }).length).toBeGreaterThanOrEqual(2);
  });

  it('demo hints đọc được: alice@demo.local + fail@demo.local (saga 4b)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText(/alice@demo\.local/)).toBeInTheDocument();
    expect(screen.getByText(/fail@demo\.local/)).toBeInTheDocument();
  });
});
