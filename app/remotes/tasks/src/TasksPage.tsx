// TasksPage — expose `./TasksPage` (registry conventions/08), shell mount vào route /tasks.
// Libs adopt 2026-10-17: data layer = TanStack Query (useInfiniteQuery + useMutation),
// form = ui-kit useForm + zod, animation = motion (framer-motion, bundle LOCAL —
// KHÔNG nằm trong shared: rspack).
// Motion redesign (mission remotes): MotionConfig reducedMotion="user" toàn cây ·
// filter indicator trượt layoutId (StatusFilter) · list stagger + AnimatePresence
// enter/exit · skeleton↔data fade mượt · empty state icon float · badge "Đã tạo
// task" pop spring trong TaskForm · flash row khi update (TaskItem). SEMANTICS
// GIỮ NGUYÊN (xem các mốc F2/F3 dưới — tests là contract).
//
// SEMANTICS GIỮ NGUYÊN từ bản useState (F2/F3 fixes — verify bằng tests):
// - Mutations cập nhật IN-PLACE qua setQueryData (KHÔNG refetch full — giữ draft edit
//   inline/confirm xoá ở dòng khác); server response = nguồn sự thật từng item.
// - Item rơi khỏi filter đang bật → remove khỏi list (total giảm theo).
// - Trang rỗng (row chưa tải đã bị xoá hết) → hasNextPage false → ẩn "Tải thêm".
// - Filter đổi → queryKey đổi → fetch mới tự động (r-q thay reqSeq guard thủ công).
// - Mutation success → invalidate ['activity'] — react-query singleton MF: cùng cache
//   với remote activity → feed/stats tự refetch (payoff của share singleton).
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useState } from 'react';
import { Alert, EmptyState, Icon, message, Skeleton } from '@wakii/ui-kit';
import {
  ApiError,
  CreateTaskInput,
  createTask,
  deleteTask,
  fetchTasks,
  Task,
  TaskStatus,
  updateTask,
} from './api';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { StatusFilter } from './components/StatusFilter';
// Tokens idempotent (quyết định #5 epic): remote import tokens trong page entry —
// shell (SF-2) cũng import global; nhiều bản cùng giá trị vô hại. KHÔNG import
// base.css ở đây — shell làm chủ global base (bp-* primitives css đi kèm base).
import '@wakii/ui-kit/styles/tokens.css';
import './app.css'; // tailwind utilities (spec tailwind-migration)

type ListKey = readonly [string, TaskStatus | null];

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    // 503 = spring-svc down khi validate user (fail-closed, contract tasks.yaml) — message rõ cho demo
    if (err.status === 503) {
      return 'Dịch vụ xác thực người dùng (spring-svc) chưa sẵn sàng — thử lại sau.';
    }
    return err.message;
  }
  return 'Không kết nối được dịch vụ tasks.';
}

export function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const listKey: ListKey = ['tasks', statusFilter] as const;

  const listQuery = useInfiniteQuery({
    queryKey: listKey,
    queryFn: ({ pageParam }) => {
      // offset chỉ gửi khi > 0 — page đầu khớp contract cũ ({} hoặc {status})
      const offset = pageParam as number;
      const params: { offset?: number; status?: TaskStatus } = offset > 0 ? { offset } : {};
      if (statusFilter) params.status = statusFilter;
      return fetchTasks(params);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // F2: trang rỗng (row chưa tải đã bị xoá hết phía server) = hết — không page kế
      if (lastPage.items.length === 0) return undefined;
      const loaded = allPages.reduce((n, p) => n + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
  });

  const tasks = listQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const total = listQuery.data?.pages[0]?.total ?? 0;
  const loading = listQuery.isLoading;
  const loadingMore = listQuery.isFetchingNextPage;

  /** In-place update trên infinite-query data — trả data mới, KHÔNG refetch. */
  function patchList(key: ListKey, patch: (pages: Array<{ items: Task[]; total: number }>) => void) {
    queryClient.setQueryData<{ pages: Array<{ items: Task[]; total: number }>; pageParams: unknown[] }>(
      key,
      (old) => {
        if (!old) return old;
        const pages = old.pages.map((p) => ({ items: [...p.items], total: p.total }));
        patch(pages);
        return { ...old, pages };
      },
    );
  }

  const invalidateActivity = () => {
    // singleton cache: remote activity đọc cùng client — feed/stats tự refetch
    void queryClient.invalidateQueries({ queryKey: ['activity'] });
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (created) => {
      setError(null);
      patchList(listKey, (pages) => {
        // total tăng ở page đầu (nguồn count); filter bật và task mới không thuộc
        // filter → chỉ tăng total, không chèn vào list
        pages[0]!.total += 1;
        if (!statusFilter || created.status === statusFilter) {
          pages[0]!.items.unshift(created);
        }
      });
      invalidateActivity();
      // Feedback "Đã tạo task" chuyển sang badge spring trong TaskForm (motion
      // redesign) — toast tĩnh bỏ để tránh double-feedback.
    },
    onError: (err) => setError(describeError(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: TaskStatus }) =>
      updateTask(task.id, { status }),
    onSuccess: (updated) => {
      setError(null);
      // item rơi khỏi filter đang bật → remove khỏi list (total giảm theo)
      if (statusFilter && updated.status !== statusFilter) {
        patchList(listKey, (pages) => {
          for (const p of pages) {
            const idx = p.items.findIndex((t) => t.id === updated.id);
            if (idx !== -1) {
              p.items.splice(idx, 1);
              p.total -= 1;
              break;
            }
          }
        });
      } else {
        patchList(listKey, (pages) => {
          for (const p of pages) {
            const idx = p.items.findIndex((t) => t.id === updated.id);
            if (idx !== -1) p.items[idx] = updated;
          }
        });
      }
      invalidateActivity();
    },
    onError: (err) => setError(describeError(err)),
  });

  const saveMutation = useMutation({
    mutationFn: ({ task, patch }: { task: Task; patch: { title?: string; description?: string } }) =>
      updateTask(task.id, patch),
    onSuccess: (updated) => {
      setError(null);
      // save không đổi status → không tương tác filter, replace in-place
      patchList(listKey, (pages) => {
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
    onSuccess: (_, removed) => {
      setError(null);
      patchList(listKey, (pages) => {
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
      message.success('Đã xoá task');
    },
    onError: (err) => setError(describeError(err)),
  });

  /** true = tạo OK — form chỉ xoá input khi true (lỗi → giữ draft user). */
  async function handleCreate(input: { title: string; description?: string }): Promise<boolean> {
    try {
      await createMutation.mutateAsync(input);
      return true;
    } catch {
      return false; // error đã set qua onError — banner ở page
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    if (status === task.status) return;
    await statusMutation.mutateAsync({ task, status }).catch(() => undefined);
  }

  /** true = PATCH OK — item chỉ thoát edit khi true (lỗi → giữ form + draft). */
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

  async function handleDelete(task: Task) {
    await deleteMutation.mutateAsync(task).catch(() => undefined);
  }

  return (
    // Motion redesign: reducedMotion="user" — tôn trọng prefers-reduced-motion
    // cho TOÀN bộ cây (stagger/indicator/flash rơi về tức thì khi user tắt motion).
    <MotionConfig reducedMotion="user">
      <motion.section
        className="flex flex-col gap-6 text-ink"
        aria-label="Quản lý tasks"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <h1 className="m-0 text-h1">Tasks</h1>

        {(error ?? (listQuery.error ? describeError(listQuery.error) : null)) !== null && (
          <Alert
            className="mb-4"
            type="error"
            message={error ?? describeError(listQuery.error)}
          />
        )}

        <TaskForm onCreate={handleCreate} />

        {/* Motion redesign: indicator nền trượt layoutId giữa các nút filter
         * (StatusFilter) — logic setStatusFilter không đổi. */}
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />

        {/* Skeleton ↔ list/empty fade mượt qua AnimatePresence mode="wait" —
         * data tới → skeleton fade-out rồi list fade-in. Mutation in-place KHÔNG
         * đi qua đây (isLoading chỉ lần đầu/đổi filter) → draft edit luôn nguyên. */}
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div
              key="tasks-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Skeleton variant="row" count={4} />
            </motion.div>
          ) : tasks.length === 0 ? (
            <motion.div
              key="tasks-empty"
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Icon minh hoạ float nhẹ — keyframe bp-float của kit tokens;
               * prefers-reduced-motion tắt animation duration về 0.01ms (global). */}
              <span
                aria-hidden="true"
                className="mb-1 text-ink3"
                style={{ animation: 'bp-float 3s ease-in-out infinite' }}
              >
                <Icon name="check-circle" size={40} />
              </span>
              <EmptyState
                title="Chưa có task nào"
                description={
                  statusFilter
                    ? 'Thử bỏ bộ lọc để xem tất cả task.'
                    : 'Tạo task đầu tiên ở form trên.'
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="tasks-list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <TaskList
                tasks={tasks}
                total={total}
                hasMore={Boolean(listQuery.hasNextPage)}
                loadingMore={loadingMore}
                onStatusChange={handleStatusChange}
                onSave={handleSave}
                onDelete={handleDelete}
                onLoadMore={() => void listQuery.fetchNextPage()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </MotionConfig>
  );
}

/** total helper cho create mutation (setQueryData phức hợp — tách cho đọc dễ). */
export default TasksPage;
