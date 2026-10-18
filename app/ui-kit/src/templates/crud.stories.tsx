// Template — CRUD Data Table (recipes-style trang quản lý task hoàn chỉnh):
// toolbar Input.Search + Select filter + Create · Table sorting 3-state +
// selection + expandable + fixed header + summary + Pagination · Drawer form
// (useForm + zod + Field, focus-first-invalid thật) · Popconfirm delete ·
// message toasts · empty state + skeleton loading toggle.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import {
  Button, Drawer, Field, Input, Input as TextInput, message, Popconfirm,
  Select, Switch, Table, useForm,
} from '../index';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  point: number;
  note: string;
  locked?: boolean;
}

const STATUS_TAG: Record<Task['status'], string> = {
  todo: 'text-ink3',
  doing: 'text-st-doing',
  done: 'text-st-done',
};

const SEED: Task[] = [
  { id: '1', title: 'Setup repo & CI', status: 'done', point: 3, note: 'pnpm workspace + Rspack + vitest xanh.' },
  { id: '2', title: 'Tasks API (CRUD + outbox)', status: 'doing', point: 8, note: 'Drizzle + outbox pattern, chưa có retry compensation.' },
  { id: '3', title: 'Kafka consumer activity', status: 'doing', point: 5, note: 'go-svc chi consume task-events.' },
  { id: '4', title: 'Saga assign demo', status: 'todo', point: 8, note: 'fail@demo.local → assignment_failed + DLQ assert.' },
  { id: '5', title: 'Design tokens dark theme', status: 'done', point: 5, note: '13 keys cascade qua CSS vars.' },
  { id: '6', title: 'Storybook a11y sweep', status: 'todo', point: 3, note: 'Focus ring + aria pass ~40 component.' },
  { id: '7', title: 'Locked — pending legal', status: 'doing', point: 2, note: 'Chờ sign-off, không xoá được (demo message.error).', locked: true },
  { id: '8', title: 'E2E smoke 15 bước', status: 'todo', point: 8, note: 'scripts/smoke/e2e.sh 2 chiều happy + saga.' },
  { id: '9', title: 'Perf: virtual table 5k rows', status: 'todo', point: 5, note: 'Windowed rows + spacer giữ scrollbar.' },
  { id: '10', title: 'Docs walkthrough', status: 'done', point: 2, note: 'walkthrough.md + toolchain.md.' },
];

// ── Drawer form (useForm + zod) — remount theo task để initialValues luôn đúng ──

const taskSchema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  status: z.enum(['todo', 'doing', 'done']),
  point: z.coerce.number().int('Số nguyên').min(1, 'Tối thiểu 1').max(13, 'Tối đa 13'),
  note: z.string(),
});
type TaskFormValues = z.infer<typeof taskSchema>;

function TaskForm({ initial, submitting, onSubmit, onCancel }: {
  initial: Task | null;
  submitting: boolean;
  onSubmit: (v: TaskFormValues) => void;
  onCancel: () => void;
}) {
  const form = useForm<TaskFormValues>({
    schema: taskSchema,
    mode: 'onChange',
    initialValues: {
      title: initial?.title ?? '',
      status: initial?.status ?? 'todo',
      point: initial?.point ?? 3,
      note: initial?.note ?? '',
    },
  });

  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      <Field label="Tiêu đề" htmlFor="task-title" required error={form.errors.title}>
        <TextInput
          id="task-title" name="title" placeholder="VD: Viết API pagination…"
          value={form.values.title} invalid={!!form.errors.title}
          onChange={form.handleChange('title')} onBlur={form.handleBlur('title')}
        />
      </Field>
      <div className="flex gap-3">
        <Field label="Trạng thái" className="flex-1" error={form.errors.status}>
          <Select
            ariaLabel="Trạng thái"
            value={form.values.status}
            onChange={(v) => form.setValue('status', String(v) as TaskFormValues['status'])}
            options={[
              { label: 'To do', value: 'todo' },
              { label: 'Doing', value: 'doing' },
              { label: 'Done', value: 'done' },
            ]}
          />
        </Field>
        <Field label="Point (1–13)" htmlFor="task-point" className="w-32" error={form.errors.point}>
          <Input
            id="task-point" name="point" type="number" min={1} max={13}
            value={String(form.values.point)} invalid={!!form.errors.point}
            onChange={(e) => form.setValue('point', e.target.value as unknown as TaskFormValues['point'])}
          />
        </Field>
      </div>
      <Field label="Ghi chú" htmlFor="task-note" hint="Chi tiết hiển thị trong row mở rộng.">
        <TextInput
          id="task-note" name="note" placeholder="Context, link, acceptance…"
          value={form.values.note} onChange={form.handleChange('note')}
        />
      </Field>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="default" onClick={onCancel}>Huỷ</Button>
        <Button htmlType="submit" type="primary" loading={submitting}>
          {initial ? 'Lưu thay đổi' : 'Tạo task'}
        </Button>
      </div>
    </form>
  );
}

// ── Trang CRUD hoàn chỉnh ──

function CrudPage({ initialLoading = false, initialQuery = '' }: { initialLoading?: boolean; initialQuery?: string }) {
  const [tasks, setTasks] = useState<Task[]>(SEED);
  const [q, setQ] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(initialLoading);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null); // null = đóng
  const [isNew, setIsNew] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => tasks.filter(
      (t) =>
        (statusFilter === 'all' || t.status === statusFilter) &&
        t.title.toLowerCase().includes(q.trim().toLowerCase()),
    ),
    [tasks, q, statusFilter],
  );

  function openCreate() {
    setIsNew(true);
    setDrawerTask(null);
  }
  function openEdit(t: Task) {
    setIsNew(false);
    setDrawerTask(t);
  }
  function removeTask(t: Task) {
    if (t.locked) {
      message.error(`"${t.title}" đang khoá — không xoá được.`);
      return;
    }
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    setSelectedKeys((prev) => prev.filter((k) => k !== t.id));
    message.success(`Đã xoá "${t.title}".`);
  }

  return (
    <div className="flex w-[860px] flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-64">
          <Input.Search aria-label="Tìm task" placeholder="Tìm theo tiêu đề…" onSearch={setQ} />
        </div>
        <Select
          ariaLabel="Lọc trạng thái"
          className="w-36"
          value={statusFilter}
          onChange={(v) => setStatusFilter(String(v))}
          options={[
            { label: 'Tất cả', value: 'all' },
            { label: 'To do', value: 'todo' },
            { label: 'Doing', value: 'doing' },
            { label: 'Done', value: 'done' },
          ]}
        />
        <Button type="primary" onClick={openCreate}>+ Create</Button>
        {selectedKeys.length > 0 && (
          <Popconfirm
            open
            title={`Xoá ${selectedKeys.length} task đã chọn?`}
            okText="Xoá" danger
            onConfirm={() => {
              setTasks((prev) => prev.filter((t) => !selectedKeys.includes(t.id)));
              message.success(`Đã xoá ${selectedKeys.length} task.`);
              setSelectedKeys([]);
            }}
            onCancel={() => setSelectedKeys([])}
          >
            <Button type="text" danger>Xoá ({selectedKeys.length})</Button>
          </Popconfirm>
        )}
        <label className="ml-auto flex items-center gap-2 text-label text-ink3">
          Loading demo
          <Switch checked={loading} onChange={setLoading} aria-label="Bật loading skeleton" />
        </label>
      </div>

      {/* Data table — sorting + selection + expandable + fixed header + summary + paginator */}
      <Table
        columns={[
          { key: 'title', title: 'Task', sortable: true },
          {
            key: 'status', title: 'Status', sortable: true,
            render: (r: Task) => <span className={`text-label font-medium ${STATUS_TAG[r.status]}`}>{r.status}</span>,
          },
          { key: 'point', title: 'Points', dataType: 'number', align: 'right', sortable: true },
          {
            key: 'act', title: '',
            render: (r: Task) => (
              <div className="flex items-center justify-end gap-1">
                <Button type="text" size="small" onClick={() => openEdit(r)}>Sửa</Button>
                {/* Popconfirm controlled — children là anchor trigger, open theo state hàng */}
                <Popconfirm
                  open={deletingId === r.id}
                  title={`Xoá "${r.title}"?`}
                  description="Hành động không thể hoàn tác."
                  okText="Xoá" cancelText="Giữ" danger
                  onConfirm={() => { removeTask(r); setDeletingId(null); }}
                  onCancel={() => setDeletingId(null)}
                >
                  <Button type="text" size="small" danger onClick={() => setDeletingId(r.id)}>Xoá</Button>
                </Popconfirm>
              </div>
            ),
          },
        ]}
        dataSource={filtered}
        rowKey="id"
        scroll={{ y: 340 }}
        striped
        selectionMode="checkbox"
        selectedRowKeys={selectedKeys}
        onSelectionChange={(rows) => setSelectedKeys(rows.map((r) => String((r as Task).id)))}
        expandable={{ expandedRowRender: (r) => <p className="text-label text-ink2">{r.note}</p> }}
        paginator
        pageSize={8}
        emptyMessage={<p className="p-6 text-body text-ink3">Không có task khớp bộ lọc — xoá từ khoá thử xem.</p>}
        summary={(page) => (
          <div className="flex items-center justify-between text-label text-ink2">
            <span>{page.length} trên trang</span>
            <span className="text-ink">Σ {page.reduce((s, r) => s + r.point, 0)} points</span>
          </div>
        )}
        loading={loading}
      />

      {/* Drawer create/edit — useForm + zod, sai → focus-first-invalid */}
      <Drawer
        open={isNew || drawerTask !== null}
        title={isNew ? 'Tạo task mới' : `Sửa: ${drawerTask?.title ?? ''}`}
        width={420}
        onClose={() => { setDrawerTask(null); setIsNew(false); }}
      >
        {(isNew || drawerTask) && (
          <TaskForm
            key={isNew ? 'new' : drawerTask!.id}
            initial={isNew ? null : drawerTask}
            submitting={false}
            onCancel={() => { setDrawerTask(null); setIsNew(false); }}
            onSubmit={(v) => {
              if (isNew) {
                setTasks((prev) => [{ ...v, id: String(Date.now()) }, ...prev]);
                message.success(`Đã tạo "${v.title}".`);
              } else {
                setTasks((prev) => prev.map((t) => (t.id === drawerTask!.id ? { ...t, ...v } : t)));
                message.success(`Đã lưu "${v.title}".`);
              }
              setDrawerTask(null);
              setIsNew(false);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

const meta = {
  title: 'Templates/CRUD Table',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

/** FullDemo — toolbar search/filter/create · sortable selectable expandable table with fixed header,
 * page summary + pagination · Drawer form (zod) · Popconfirm delete · toasts · loading toggle. */
export const FullDemo: Story = {
  render: () => <CrudPage />,
};

/** EmptyAndLoading — boots with the skeleton on and a non-matching search (empty state). */
export const EmptyAndLoading: Story = {
  render: () => <CrudPage initialLoading initialQuery="zzz-no-match" />,
};
