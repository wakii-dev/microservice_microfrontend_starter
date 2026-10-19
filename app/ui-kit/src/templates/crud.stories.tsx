// Template-MAX — CRUD Data Table (recipes-style trang quản lý task hoàn chỉnh, R11):
// toolbar Input.Search + Select filter + Segmented view (bảng/thẻ) + Create +
// batch actions khi chọn · Table sorting 3-state + selection + expandable +
// fixed header + summary + Pagination · Drawer CREATE khác EDIT (edit có nested
// Descriptions + Timeline audit) · useForm + zod focus-first-invalid · Popconfirm
// delete (row + batch) · message toasts · EMPTY / SKELETON / ERROR 3 state toggle.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import {
  Alert, Avatar, Badge, Button, Card, Col, Descriptions, Drawer, Field, Flex, Icon,
  Input, Input as TextInput, message, Popconfirm, Progress, Row, Segmented, Select,
  Statistic, Switch, Table, Tag, Timeline, Tooltip, useForm,
} from '../index';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  point: number;
  note: string;
  owner: string;
  locked?: boolean;
}

const STATUS_BADGE: Record<Task['status'], { variant: 'todo' | 'doing' | 'done'; label: string }> = {
  todo: { variant: 'todo', label: 'To do' },
  doing: { variant: 'doing', label: 'Doing' },
  done: { variant: 'done', label: 'Done' },
};

const OWNERS = ['alice', 'bob', 'carol'];

const SEED: Task[] = [
  { id: '1', title: 'Setup repo & CI', status: 'done', point: 3, note: 'pnpm workspace + Rspack + vitest xanh.', owner: 'alice' },
  { id: '2', title: 'Tasks API (CRUD + outbox)', status: 'doing', point: 8, note: 'Drizzle + outbox pattern, chưa có retry compensation.', owner: 'bob' },
  { id: '3', title: 'Kafka consumer activity', status: 'doing', point: 5, note: 'go-svc chi consume task-events.', owner: 'carol' },
  { id: '4', title: 'Saga assign demo', status: 'todo', point: 8, note: 'fail@demo.local → assignment_failed + DLQ assert.', owner: 'alice' },
  { id: '5', title: 'Design tokens dark theme', status: 'done', point: 5, note: '13 keys cascade qua CSS vars.', owner: 'bob' },
  { id: '6', title: 'Storybook a11y sweep', status: 'todo', point: 3, note: 'Focus ring + aria pass ~40 component.', owner: 'carol' },
  { id: '7', title: 'Locked — pending legal', status: 'doing', point: 2, note: 'Chờ sign-off, không xoá được (demo message.error).', owner: 'alice', locked: true },
  { id: '8', title: 'E2E smoke 15 bước', status: 'todo', point: 8, note: 'scripts/smoke/e2e.sh 2 chiều happy + saga.', owner: 'bob' },
  { id: '9', title: 'Perf: virtual table 5k rows', status: 'todo', point: 5, note: 'Windowed rows + spacer giữ scrollbar.', owner: 'carol' },
  { id: '10', title: 'Docs walkthrough', status: 'done', point: 2, note: 'walkthrough.md + toolchain.md.', owner: 'alice' },
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

// ── Nested detail (chỉ Drawer EDIT): Descriptions + Timeline audit ──

function TaskDetailSection({ task }: { task: Task }) {
  return (
    <div className="mt-6 border-t border-line2 pt-4">
      <span className="text-body font-semibold text-ink">Chi tiết &amp; nhật ký</span>
      <Descriptions
        className="mt-3"
        items={[
          { label: 'Người thực hiện', children: <span className="font-mono text-label">{task.owner}</span> },
          { label: 'Điểm', children: <Badge variant={STATUS_BADGE[task.status].variant}>{task.point} pts</Badge> },
          { label: 'Khoá', children: task.locked ? <Tag icon={<Icon name="clock" size={10} />}>legal hold</Tag> : <Tag>không</Tag> },
        ]}
      />
      <Timeline
        className="mt-4"
        items={[
          { key: 'a1', children: `${task.owner} tạo task`, label: '2 ngày trước' },
          { key: 'a2', color: 'var(--st-doing)', children: `Chuyển sang ${task.status}`, label: '1 ngày trước' },
          { key: 'a3', color: 'var(--st-fail)', children: 'CI fail lần 2 — fix lint', label: '5 giờ trước' },
        ]}
      />
    </div>
  );
}

// ── Trang CRUD hoàn chỉnh ──

function CrudPage({ initialLoading = false, initialQuery = '' }: { initialLoading?: boolean; initialQuery?: string }) {
  const [tasks, setTasks] = useState<Task[]>(SEED);
  const [q, setQ] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(initialLoading);
  const [apiError, setApiError] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null); // null = đóng
  const [isNew, setIsNew] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => tasks.filter(
      (t) =>
        (statusFilter === 'all' || t.status === statusFilter) &&
        (ownerFilter === 'all' || t.owner === ownerFilter) &&
        t.title.toLowerCase().includes(q.trim().toLowerCase()),
    ),
    [tasks, q, statusFilter, ownerFilter],
  );
  const donePct = Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100);

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

  const actionCols = [
    {
      key: 'act', title: '',
      render: (r: Task) => (
        <div className="flex items-center justify-end gap-1">
          <Button type="text" size="small" onClick={() => openEdit(r)}>Sửa</Button>
          <Tooltip title={r.locked ? 'Task đang khoá — không xoá được' : 'Xoá task'}>
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
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex w-full max-w-[880px] flex-col gap-3">
      {/* Toolbar — Search + 2 filter + Segmented view + Create + batch actions + 3-state toggles */}
      <Flex gap="small" wrap className="items-center">
        <div className="w-56">
          <Input.Search aria-label="Tìm task" placeholder="Tìm theo tiêu đề…" onSearch={setQ} />
        </div>
        <Select
          ariaLabel="Lọc trạng thái"
          className="w-32"
          value={statusFilter}
          onChange={(v) => setStatusFilter(String(v))}
          options={[
            { label: 'Tất cả', value: 'all' },
            { label: 'To do', value: 'todo' },
            { label: 'Doing', value: 'doing' },
            { label: 'Done', value: 'done' },
          ]}
        />
        <Select
          ariaLabel="Lọc người thực hiện"
          className="w-32"
          value={ownerFilter}
          onChange={(v) => setOwnerFilter(String(v))}
          options={[{ label: 'Mọi người', value: 'all' }, ...OWNERS.map((o) => ({ label: o, value: o }))]}
        />
        <Segmented
          options={[
            { label: 'Bảng', value: 'table' },
            { label: 'Thẻ', value: 'cards' },
          ]}
          value={view}
          onChange={setView}
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
        <span className="ml-auto flex items-center gap-3 text-label text-ink3">
          <span className="flex items-center gap-1">
            Loading <Switch checked={loading} onChange={setLoading} aria-label="Bật loading skeleton" size="small" />
          </span>
          <span className="flex items-center gap-1">
            Error <Switch checked={apiError} onChange={setApiError} aria-label="Bật demo lỗi API" size="small" />
          </span>
        </span>
      </Flex>

      {/* Sprint progress mini — live theo data */}
      <Card className={CARD_DEPTH}>
        <Flex gap="middle" className="items-center">
          <Statistic title="Tiến độ sprint" value={`${donePct}%`} valueStyle={NUM_TIGHT} />
          <div className="min-w-0 flex-1">
            <Progress percent={donePct} />
          </div>
          <Avatar>A</Avatar>
          <Avatar>B</Avatar>
          <span key={donePct} className="animate-[bp-switch-pop_var(--motion-fast)_var(--ease-toggle)] font-mono text-meta tabular-nums text-ink3">
            3 người · {tasks.length} task
          </span>
        </Flex>
      </Card>

      {/* ERROR state — banner + retry (demo toggle). Alert không có prop action →
          nút retry đứng cạnh banner trong cùng Flex. */}
      {apiError && (
        <Flex gap="middle" className="items-center">
          <Alert
            type="error"
            message="Không tải được danh sách task"
            description="GET /api/tasks trả 503 — retry 3 lần rồi vào DLQ (demo)."
          />
          <Button size="small" onClick={() => setApiError(false)}>Thử lại</Button>
        </Flex>
      )}

      {/* Data area — bảng hoặc thẻ theo Segmented view */}
      {view === 'table' ? (
        <Table
          columns={[
            {
              key: 'title', title: 'Task', sortable: true,
              render: (r: Task) => (
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-meta text-ink3">#{r.id}</span>
                  <span className="text-ink">{r.title}</span>
                </span>
              ),
            },
            {
              key: 'status', title: 'Status', sortable: true,
              render: (r: Task) => <Badge variant={STATUS_BADGE[r.status].variant}>{STATUS_BADGE[r.status].label}</Badge>,
            },
            { key: 'owner', title: 'Owner', render: (r: Task) => <Tag>{r.owner}</Tag> },
            {
              key: 'point', title: 'Points', dataType: 'number', align: 'right', sortable: true,
              render: (r: Task) => <span className="font-mono tabular-nums">{r.point}</span>,
            },
            ...actionCols,
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
      ) : (
        <Row gutter={[12, 12]}>
          {loading
            ? null
            : filtered.map((t) => (
                <Col key={t.id} xs={24} md={12}>
                  {/* Card không có prop onClick → bọc div role=button (a11y); stagger + press chìm 1px */}
                  <div
                    role="button" tabIndex={0}
                    className={`cursor-pointer ${STAGGER_CLS} ${DEPTH_TX} active:translate-y-px`}
                    style={stagger(Number(t.id) % 8)}
                    onClick={() => openEdit(t)}
                  >
                    <Card
                      title={t.title}
                      extra={<Badge variant={STATUS_BADGE[t.status].variant}>{STATUS_BADGE[t.status].label}</Badge>}
                      hoverable
                      className="h-full shadow-[var(--ele-1)]"
                    >
                      <p className="m-0 text-label text-ink3">{t.note}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar size={22}>{t.owner.charAt(0).toUpperCase()}</Avatar>
                        <Tag>{t.owner}</Tag>
                        <span className="ml-auto font-mono text-meta text-ink3 tabular-nums">{t.point} pts</span>
                      </div>
                    </Card>
                  </div>
                </Col>
              ))}
        </Row>
      )}

      {/* Drawer CREATE vs EDIT — edit thêm nested Descriptions + Timeline audit */}
      <Drawer
        open={isNew || drawerTask !== null}
        title={isNew ? 'Tạo task mới' : `Sửa: ${drawerTask?.title ?? ''}`}
        width={440}
        onClose={() => { setDrawerTask(null); setIsNew(false); }}
      >
        {(isNew || drawerTask) && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <Avatar size={32}>{(isNew ? 'n' : drawerTask!.owner).charAt(0).toUpperCase()}</Avatar>
              <span className="text-label text-ink3">
                {isNew ? 'Task mới — sẽ được gán sau khi tạo' : `Owner: ${drawerTask!.owner}`}
              </span>
            </div>
            <TaskForm
              key={isNew ? 'new' : drawerTask!.id}
              initial={isNew ? null : drawerTask}
              submitting={false}
              onCancel={() => { setDrawerTask(null); setIsNew(false); }}
              onSubmit={(v) => {
                if (isNew) {
                  setTasks((prev) => [{ ...v, id: String(Date.now()), owner: 'alice' }, ...prev]);
                  message.success(`Đã tạo "${v.title}".`);
                } else {
                  setTasks((prev) => prev.map((t) => (t.id === drawerTask!.id ? { ...t, ...v } : t)));
                  message.success(`Đã lưu "${v.title}".`);
                }
                setDrawerTask(null);
                setIsNew(false);
              }}
            />
            {!isNew && <TaskDetailSection task={drawerTask!} />}
          </>
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

// ── Depth contract (docs/team/depth-demos/direction-approved.md) ──
const DEPTH_TX = 'transition-[box-shadow,border-color,transform] duration-[240ms] ease-[var(--ease-smooth)]';
const CARD_DEPTH = `shadow-[var(--ele-1)] ${DEPTH_TX} hover:shadow-[var(--ele-2)] hover:border-ink/20 hover:-translate-y-px`;
const STAGGER_CLS = 'animate-[bp-fade-in_var(--motion-base)_var(--ease-smooth)_backwards]';
const stagger = (i: number, step = 32) => ({ animationDelay: `${i * step}ms` });
const NUM_TIGHT = { letterSpacing: '-0.02em' } as const;

/** FullDemo — toolbar search/2 filter/Segmented view/create + batch delete · sortable selectable
 * expandable fixed-header table + summary + pagination · Drawer CREATE vs EDIT (nested
 * Descriptions + Timeline) · EMPTY / SKELETON / ERROR 3 state toggle · toasts. */
export const Full_Demo: Story = {
  render: () => <CrudPage />,
};

/** EmptyAndLoading — boots with the skeleton on and a non-matching search (empty state). */
export const EmptyAndLoading: Story = {
  render: () => <CrudPage initialLoading initialQuery="zzz-no-match" />,
};

/** DarkTheme — surface ladder + ele re-bake cascade qua token, không code riêng cho dark. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="min-h-screen bg-canvas p-4">
      <CrudPage />
    </div>
  ),
};
