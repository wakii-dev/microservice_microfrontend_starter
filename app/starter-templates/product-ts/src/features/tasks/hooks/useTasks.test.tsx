// hooks test mẫu — renderHook + wrapper QueryClientProvider. Mock MODULE
// tasks-api (không cần network): tập trung assert hợp đồng hook — list data +
// optimistic toggle (đổi NGAY trước khi server trả lời).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTaskStatus, type Task } from '../schema/schema';
import { useTasks } from './useTasks';

const TASKS: Task[] = [
  { id: 1, title: 'Viết test', status: 'todo', assignee: null, createdAt: '2026-01-10T08:00:00.000Z' },
  { id: 2, title: 'Review', status: 'doing', assignee: 'bob', createdAt: '2026-01-11T08:00:00.000Z' },
];

const listMock = vi.fn<() => Promise<Task[]>>();
const toggleApiMock = vi.fn<(task: Task) => Promise<Task>>();

vi.mock('../api/tasks-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/tasks-api')>();
  return {
    ...actual,
    tasksApi: {
      ...actual.tasksApi,
      list: () => listMock(),
      toggleStatus: (task: Task) => toggleApiMock(task),
    },
  };
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('useTasks', () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue(TASKS);
    toggleApiMock.mockReset().mockImplementation(async (task) => ({ ...task, status: nextTaskStatus(task.status) }));
  });

  it('list → query.data là Task[] sau khi resolve', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => expect(result.current.query.isPending).toBe(false));
    expect(result.current.query.data).toEqual(TASKS);
  });

  it('toggle → OPTIMISTIC: cache đổi ngay khi server chưa trả (todo → doing)', async () => {
    let resolveToggle: ((task: Task) => void) | undefined;
    toggleApiMock.mockImplementation(
      () => new Promise<Task>((resolve) => { resolveToggle = resolve; }),
    );
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useTasks(), { wrapper });
    await waitFor(() => expect(result.current.query.data).toEqual(TASKS));

    act(() => result.current.toggle.mutate(TASKS[0]));

    // Trước khi promise toggle resolve — cache ĐÃ đổi (không chờ server)
    await waitFor(() => {
      const cached = queryClient.getQueryData<Task[]>(['tasks', 'list']);
      expect(cached?.find((t) => t.id === 1)?.status).toBe('doing');
    });

    await act(async () => resolveToggle?.({ ...TASKS[0], status: 'doing' }));
    await waitFor(() => expect(result.current.toggle.isPending).toBe(false));
  });
});
