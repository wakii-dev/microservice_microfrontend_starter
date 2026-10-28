// Router test — render shell THẬT qua MemoryRouter: xác nhận 2 route khai báo
// trong <Routes> render đúng trang (home ở '/', mọi đường khác → not-found).
// Route là lazy+Suspense → dùng findBy* (await) thay get* đồng bộ. Không cần
// Provider gì thêm — Router chỉ dùng useAppTheme (localStorage) + Skeleton.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Router } from './router';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Router />
    </MemoryRouter>,
  );
}

describe('Router — routes render', () => {
  it("'/' → HomePage (lazy) với header shell + tiêu đề chào mừng", async () => {
    renderAt('/');

    // Header shell có mặt + route home đã thay Suspense fallback
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: /Chào mừng đến với/ })).toHaveTextContent(
      '{{appName}}',
    );
  });

  it('đường lạ → NotFoundPage (Result 404) + link về trang chủ', async () => {
    renderAt('/duong-khong-ton-tai');

    expect(await screen.findByText('Không tìm thấy trang')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Về trang chủ' })).toHaveAttribute('href', '/');
  });
});
