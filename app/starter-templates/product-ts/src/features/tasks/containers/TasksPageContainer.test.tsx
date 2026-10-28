// Integration test — render container THẬT (MSW + QueryClient + UI), không mock
// module: đi hết đường fetch → zod parse → hook → UI. 2 flag demo của handlers
// (?empty=1 / ?boom=1) là cách bật đúng 2 nhánh UI (EmptyState / Alert lỗi) mà
// không đụng data seed. jsdom cho sửa URL qua history.replaceState.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { handlers } from '@/mocks/handlers';
import { TasksPageContainer } from './TasksPageContainer';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  window.history.replaceState(null, '', '/'); // bỏ flag demo — test sau khởi sạch
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TasksPageContainer />
    </QueryClientProvider>,
  );
}

describe('TasksPageContainer — trạng thái đặc biệt qua flag demo', () => {
  it('?empty=1 → EmptyState thay bảng (sau khi load xong)', async () => {
    window.history.replaceState(null, '', '/?empty=1');
    renderPage();

    expect(await screen.findByText('Chưa có task nào')).toBeInTheDocument();
    expect(screen.queryByText('Đọc AGENTS.md')).not.toBeInTheDocument();
  });

  it('?boom=1 → Alert lỗi; bỏ flag + bấm Thử lại → list quay lại', async () => {
    window.history.replaceState(null, '', '/?boom=1');
    renderPage();

    expect(await screen.findByText('Không tải được danh sách task')).toBeInTheDocument();
    expect(screen.queryByText('Đọc AGENTS.md')).not.toBeInTheDocument();

    window.history.replaceState(null, '', '/');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Đọc AGENTS.md')).toBeInTheDocument();
  });
});
