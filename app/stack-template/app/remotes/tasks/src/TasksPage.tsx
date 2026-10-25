// TasksPage — KANBAN BOARD compact pro (redesign 2026-10-25, user chê list cũ):
// toolbar (search debounce + sort + "＋ Thêm" modal) · progress n/N xong ·
// 3 cột writable + slim "Gán thất bại" · drag card đổi status (pickColumn
// hit-test) với fallback StatusSelect bàn phím.
//
// SEMANTICS GIỮ NGUYÊN từ list cũ (F2/F3 — tests là contract):
// - Mutations cập nhật IN-PLACE qua setQueryData (KHÔNG refetch full) — draft
//   modal/other cards không mất; server response = nguồn sự thật từng item.
// - Board fetch KHÔNG status param (cả 3 cột từ 1 query); "Tải thêm" board-level.
// - Mutation success → invalidate ['activity'] (singleton cache MF).
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState } from 'react';
import { Alert, Skeleton, useDebounce } from '@wakii/ui-kit';
import {
  ApiError,
  CreateTaskInput,
  Task,
  TaskStatus,
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from './api';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { TaskModal } from './components/kanban/TaskModal';
import { Toolbar } from './components/kanban/Toolbar';
import type { BoardSort } from './components/kanban/utils';
import '@wakii/ui-kit/styles/tokens.css';
import './app.css';

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    // 503 = spring-svc down khi validate user (fail-closed, contract tasks.yaml)
    if (err.status === 503) {
      return 'Dịch vụ xác thực người dùng (spring-svc) chưa sẵn sàng — thử lại sau.';
    }
    return err.message;
  }
  return 'Không kết nối được dịch vụ tasks.';
}

interface ModalState {
  mode: 'create' | 'edit';
  task?: Task;
}

export function TasksPage() {
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const [sort, setSort] = useState<BoardSort>('newest');
  const [modal, setModal] = useState<ModalState | null>(null);
  const queryClient = useQueryClient();

  const listQuery = useInfiniteQuery({
    queryKey: ['tasks'],
    queryFn: ({ pageParam }) => {
      const offset = pageParam as number;
      return fetchTasks(offset > 0 ? { offset } : {});
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.items.length === 0) return undefined; // F2: trang rỗng = hết thật
      const loaded = allPages.reduce((n, p) => n + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
  });

  const tasks = listQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const total = listQuery.data?.pages[0]?.total ?? 0;
  const loading = listQuery.isLoading;
  const loadingMore = listQuery.isFetchingNextPage;

  /** In-place update trên infinite-query data — KHÔNG refetch (F3). */
  function patchList(patch: (pages: Array<{ items: Task[]; total: number }>) => void) {
    queryClient.setQueryData<{ pages: Array<{ items: Task[]; total: number }>; pageParams: unknown[] }>(
      ['tasks'],
      (old) => {
        if (!old) return old;
        const pages = old.pages.map((p) => ({ items: [...p.items], total: p.total }));
        patch(pages);
        return { ...old, pages };
      },
    );
  }

  const invalidateActivity = () => {
    void queryClient.invalidateQueries({ queryKey: ['activity'] });
  };

  const [busyId, setBusyId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (created) => {
      setError(null);
      patchList((pages) => {
        pages[0]!.total += 1;
        pages[0]!.items.unshift(created);
      });
      invalidateActivity();
    },
    onError: (err) => setError(describeError(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: TaskStatus }) => updateTask(task.id, { status }),
    onMutate: ({ task }) => setBusyId(task.id),
    onSettled: () => setBusyId(null),
    onSuccess: (updated) => {
      setError(null);
      patchList((pages) => {
        for (const p of pages) {
          const idx = p.items.findIndex((t) => t.id === updated.id);
          if (idx !== -1) p.items[idx] = updated;
        }
      });
      invalidateActivity();
    },
    onError: (err) => setError(describeError(err)),
  });

  const saveMutation = useMutation({
    mutationFn: ({ task, patch }: { task: Task; patch: { title?: string; description?: string } }) =>
      updateTask(task.id, patch),
    onMutate: ({ task }) => setBusyId(task.id),
    onSettled: () => setBusyId(null),
    onSuccess: (updated) => {
      setError(null);
      patchList((pages) => {
        for (const p of pages) {
          const idx = p.items.findIndex((t) => t.id === updated.id);
          if (idx !== -1) p.items[idx] = updated;
        }
      });
      invalidateActivity();
    },
    onError: (err) => setError(describeError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (task: Task) => deleteTask(task.id),
    onMutate: (task) => setBusyId(task.id),
    onSettled: () => setBusyId(null),
    onSuccess: (_, removed) => {
      setError(null);
      patchList((pages) => {
        for (const p of pages) {
          const idx = p.items.findIndex((t) => t.id === removed.id);
          if (idx !== -1) {
            p.items.splice(idx, 1);
            p.total -= 1;
            break;
          }
        }
      });
      invalidateActivity();
    },
    onError: (err) => setError(describeError(err)),
  });

  async function handleCreate(input: { title: string; description?: string }): Promise<boolean> {
    try {
      await createMutation.mutateAsync(input);
      return true;
    } catch {
      return false; // error đã set qua onError — banner ở page
    }
  }

  async function handleSave(
    task: Task,
    patch: { title?: string; description?: string },
  ): Promise<boolean> {
    try {
      await saveMutation.mutateAsync({ task, patch });
      return true;
    } catch {
      return false;
    }
  }

  // Search client-side theo tiêu đề (đã debounce) — lọc TRÊN card đã tải.
  const visible = debouncedQuery
    ? tasks.filter((t) => t.title.toLowerCase().includes(debouncedQuery.trim().toLowerCase()))
    : tasks;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  return (
    // reducedMotion="user" — tôn trọng prefers-reduced-motion toàn cây
    <MotionConfig reducedMotion="user">
      <section className="flex flex-col gap-4 text-ink" aria-label="Quản lý tasks">
        <h1 className="m-0 text-h1">Tasks</h1>

        {(error ?? (listQuery.error ? describeError(listQuery.error) : null)) !== null && (
          <Alert type="error" message={error ?? describeError(listQuery.error)} />
        )}

        <Toolbar
          query={query}
          onQueryChange={setQuery}
          sort={sort}
          onSortChange={setSort}
          done={doneCount}
          total={tasks.length}
          onCreate={() => setModal({ mode: 'create' })}
        />

        {/* Skeleton 3 cột khi load đầu */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3" aria-busy="true" role="status" aria-label="Đang tải tasks">
            {[0, 1, 2].map((col) => (
              <div key={col} className="flex flex-col gap-2 rounded-xl border border-line bg-s2/50 p-2.5">
                <Skeleton variant="row" count={2} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <KanbanBoard
              tasks={visible}
              sort={sort}
              busyId={busyId}
              onStatusChange={(task, status) => void statusMutation.mutateAsync({ task, status }).catch(() => undefined)}
              onEdit={(task) => setModal({ mode: 'edit', task })}
              onDelete={(task) => void deleteMutation.mutateAsync(task).catch(() => undefined)}
            />
            {Boolean(listQuery.hasNextPage) && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void listQuery.fetchNextPage()}
                className="self-center cursor-pointer rounded-lg border border-line bg-s1 px-4 py-1.5 text-label text-ink2 transition-colors hover:bg-s3 hover:text-ink disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore ? 'Đang tải thêm…' : 'Tải thêm'}
              </button>
            )}
          </>
        )}
      </section>

      <TaskModal
        open={modal !== null}
        mode={modal?.mode ?? 'create'}
        initial={
          modal?.mode === 'edit' && modal.task
            ? { title: modal.task.title, description: modal.task.description ?? '' }
            : { title: '', description: '' }
        }
        submitting={createMutation.isPending || saveMutation.isPending}
        onClose={() => setModal(null)}
        onSubmit={async (values) => {
          if (modal?.mode === 'edit' && modal.task) {
            const task = modal.task;
            // chỉ gửi field THAY ĐỔI (UpdateTaskRequest minProperties 1)
            const patch: { title?: string; description?: string } = {};
            if (values.title !== task.title) patch.title = values.title;
            if ((task.description ?? '') !== values.description) patch.description = values.description;
            if (Object.keys(patch).length === 0) return true;
            return handleSave(task, patch);
          }
          return handleCreate({ title: values.title, description: values.description || undefined });
        }}
      />
    </MotionConfig>
  );
}

export default TasksPage;
