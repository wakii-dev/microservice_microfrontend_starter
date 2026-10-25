# AI Recipes — 19 công thức UI dùng `@wakii/ui-kit`

Code dưới dùng **API thật đã verify theo source** (audit 2026-10-18). Import gốc:

```tsx
import { /* components */ } from '@wakii/ui-kit';
import { z } from 'zod'; // peer-dep cho useForm
```

Quy tắc chung xem [AGENTS.md](../../AGENTS.md). Mỗi recipe tự chứa đủ imports riêng để copy-chạy.

---

## 1. LoginForm — useForm + zod + Field + Input + Button

```tsx
import { useState } from 'react';
import { z } from 'zod';
import { Button, Field, Input, useForm } from '@wakii/ui-kit';

const schema = z.object({
  email: z.string().min(1, 'Email bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu cần 8–72 ký tự.').max(72, 'Mật khẩu cần 8–72 ký tự.'),
});

export function LoginForm({ onLogin }: { onLogin: (d: { email: string; password: string }) => Promise<void> }) {
  const form = useForm({ schema, initialValues: { email: '', password: '' }, mode: 'onSubmit' });
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="flex w-80 flex-col gap-3"
      onSubmit={form.handleSubmit(async (data) => {
        setSubmitting(true);
        try {
          await onLogin(data); // sai → throw Error('Email hoặc mật khẩu không đúng.')
        } catch (e) {
          setServerError((e as Error).message);
        } finally {
          setSubmitting(false);
        }
      })}
    >
      <Field label="Email" htmlFor="email" error={form.errors.email}>
        <Input id="email" name="email" type="email" autoComplete="username" placeholder="you@demo.local"
          value={form.values.email} invalid={!!form.errors.email}
          onChange={form.handleChange('email')} onBlur={form.handleBlur('email')} />
      </Field>
      <Field label="Mật khẩu" htmlFor="password" error={form.errors.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password"
          value={form.values.password} invalid={!!form.errors.password}
          onChange={form.handleChange('password')} />
      </Field>
      {serverError && <p role="alert" className="text-meta text-st-fail">{serverError}</p>}
      <Button htmlType="submit" loading={submitting} disabled={submitting} block>Đăng nhập</Button>
    </form>
  );
}
```

Ghi chú: sai schema → `handleSubmit` tự set `errors` + focus field đầu (`[name=…]`); `mode` đổi thành `'onBlur' | 'onChange'` nếu muốn validate sớm.

## 2. CrudUserPage — Table + Select filter + Pagination + Modal + message

```tsx
import { useMemo, useState } from 'react';
import { Button, Field, Input, message, Modal, Pagination, Select, Table } from '@wakii/ui-kit';

type User = { id: number; name: string; role: 'admin' | 'user' };
const USERS: User[] = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Carol', role: 'user' },
];

export function CrudUserPage() {
  const [users, setUsers] = useState(USERS);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);

  const filtered = useMemo(
    () => users.filter((u) => roleFilter === 'all' || u.role === roleFilter),
    [users, roleFilter],
  );
  const pageSize = 2;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* FilterBar */}
      <div className="flex items-center gap-2">
        <Select
          ariaLabel="Lọc theo vai trò"
          className="w-44"
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1); }}
          options={[
            { label: 'Tất cả', value: 'all' },
            { label: 'Admin', value: 'admin' },
            { label: 'User', value: 'user' },
          ]}
        />
      </div>

      <Table
        columns={[
          { key: 'name', title: 'Tên', sortable: true },
          { key: 'role', title: 'Vai trò' },
          {
            key: 'act', title: '',
            render: (row: User) => <Button size="small" onClick={() => setEditing(row)}>Sửa</Button>,
          },
        ]}
        dataSource={paged}
        rowKey="id"
        emptyMessage={<p className="p-4 text-body text-ink3">Không có user phù hợp.</p>}
      />
      <Pagination current={page} pageSize={pageSize}
        total={filtered.length} onChange={setPage} />

      <Modal open={!!editing} title={`Sửa: ${editing?.name ?? ''}`}
        onOk={() => { message.success('Đã lưu'); setEditing(null); }}
        onCancel={() => setEditing(null)}>
        <Field label="Tên" htmlFor="u-name">
          <Input id="u-name" value={editing?.name ?? ''} onChange={(e) =>
            setEditing(editing ? { ...editing, name: e.target.value } : editing)} />
        </Field>
      </Modal>
    </div>
  );
}
```

## 3. FilterBar — Select + Input + Button

```tsx
import { Button, Icon, Input, Select } from '@wakii/ui-kit';

export function FilterBar({ q, setQ, status, setStatus, onReset }: {
  q: string; setQ: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input className="w-56" placeholder="Tìm theo tên…" allowClear prefix={<Icon name="search" size={14} />}
        value={q} onChange={setQ} />
      <Select className="w-40" ariaLabel="Trạng thái" value={status} onChange={setStatus}
        options={[{ label: 'Tất cả', value: 'all' }, { label: 'Đang làm', value: 'doing' }, { label: 'Xong', value: 'done' }]} />
      <Button type="text" icon={<Icon name="refresh" size={14} />} onClick={onReset}>Đặt lại</Button>
    </div>
  );
}
```

## 4. Wizard — Steps

```tsx
import { useState } from 'react';
import { Button, Steps } from '@wakii/ui-kit';

const STEPS = [
  { title: 'Chọn loại', description: 'Task hay bug' },
  { title: 'Điền thông tin', description: 'Tiêu đề + assignee' },
  { title: 'Xác nhận', description: 'Review rồi tạo' },
];

export function Wizard() {
  const [current, setCurrent] = useState(0);
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Steps items={STEPS} current={current} />
      <div className="min-h-24 rounded-xl border border-line bg-s2 p-4 text-body text-ink2">
        Nội dung bước {current + 1} — {STEPS[current]?.description}
      </div>
      <div className="flex gap-2">
        <Button disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>Quay lại</Button>
        {current < STEPS.length - 1
          ? <Button type="primary" onClick={() => setCurrent((c) => c + 1)}>Tiếp</Button>
          : <Button type="primary" onClick={() => setCurrent(0)}>Hoàn tất</Button>}
      </div>
    </div>
  );
}
```

## 5. Upload kèm preview — UploadDropzone + Progress

```tsx
import { useRef, useState } from 'react';
import { UploadDropzone } from '@wakii/ui-kit';

export function UploadKemPreview({ onChange }: { onChange?: (files: File[]) => void }) {
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);

  return (
    <div className="flex flex-col gap-3">
      <UploadDropzone
        accept="image/*"
        multiple
        maxCount={5}
        onChange={(files) => {
          onChange?.(files);
          // component tự render danh sách file chuẩn (tên + size + × remove);
          // preview ảnh tự dựng từ File[]
          setPreviews(files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })));
        }}
      />
      {previews.length > 0 && (
        <div className="flex gap-2">
          {previews.map((u) => (
            <img key={u.url} src={u.url} alt={u.name} className="size-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
```

*(Danh sách `UploadItem` (tên + size + Progress) do `UploadDropzone` tự render; `onChange` trả `File[]` để consumer dựng preview.)*

## 6. DashboardLayout — stat cards + Chart + Timeline

```tsx
import { Card, Chart, EmptyState, Icon, Tag, Timeline, type ChartConfig } from '@wakii/ui-kit';

// ⚠️ Shape NATIVE chart.js v4 — data lồng trong data:{labels,datasets}
const config = {
  type: 'line' as const,
  data: {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [{ label: 'Tasks', data: [12, 19, 8, 22, 30, 25, 18], borderColor: 'var(--accent)', tension: 0.35, fill: true }],
  },
  options: { responsive: true, maintainAspectRatio: false, animation: false },
} as unknown as ChartConfig;

const STATS = [
  { title: 'Người dùng', value: '1.284', tag: '+12%', icon: 'users' as const },
  { title: 'Tasks mở', value: '316', tag: '+5%', icon: 'check-circle' as const },
];

export function DashboardLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.title} hoverable>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                <Icon name={s.icon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-body text-ink2">{s.title}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-2xl font-semibold leading-tight text-ink">{s.value}</span>
                  <span className="rounded-pill bg-st-done/10 px-1.5 py-0.5 text-[10px] font-medium text-st-done">{s.tag}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card title="Hoạt động 7 ngày" extra={<Tag>Tuần này</Tag>} className="xl:col-span-3">
          <div className="h-64"><Chart config={config} height={256} /></div>
        </Card>
        <Card title="Timeline" extra={<Tag>real-time</Tag>} className="xl:col-span-2">
          <Timeline items={[
            { key: 't1', children: 'Alice tạo task', label: '10 phút trước' },
            { key: 't2', color: 'var(--st-done)', children: 'Bot sync Kafka', label: '1 giờ trước' },
          ]} />
        </Card>
      </div>
    </div>
  );
}
```

## 7. MasterDetailDrawer — List + Avatar + Drawer

```tsx
import { useState } from 'react';
import { Avatar, Button, Drawer, List } from '@wakii/ui-kit';

const PEOPLE = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
];

export function MasterDetailDrawer() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(PEOPLE[0]);

  return (
    <>
      <List
        items={PEOPLE}
        renderItem={(p) => (
          <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-s3"
            onClick={() => { setActive(p); setOpen(true); }}>
            <Avatar size={28}>{p.name.charAt(0)}</Avatar>
            <span className="text-body text-ink">{p.name}</span>
            <span className="ml-auto text-meta text-ink3">{p.role}</span>
          </button>
        )}
      />
      <Drawer open={open} title={active.name} width={360} onClose={() => setOpen(false)}
        footer={<Button type="primary" onClick={() => setOpen(false)}>Đóng</Button>}>
        <p className="text-body text-ink2">Chi tiết của {active.name} ({active.role}).</p>
      </Drawer>
    </>
  );
}
```

## 8. NotificationFlow — message + Badge bell

```tsx
import { Badge, Button, Icon, message, notification } from '@wakii/ui-kit';

export function NotificationFlow() {
  const notify = () => {
    message.success('Đã lưu task');
    notification.info('Kafka event', 'task.updated — feed activity đã cập nhật.');
  };
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Thông báo (2 mới)"
        className="relative cursor-pointer rounded-2 border-none bg-transparent p-1.5 text-ink2 hover:bg-s3">
        <Icon name="bell" size={18} />
        <span className="absolute -right-1 -top-1"><Badge variant="failed">2</Badge></span>
      </button>
      <Button type="primary" onClick={notify}>Kích hoạt sự kiện</Button>
    </div>
  );
}
```

## 9. FormSettings — Tabs + Switch + Field

```tsx
import { useState } from 'react';
import { Field, Input, Switch, Tabs } from '@wakii/ui-kit';

export function FormSettings() {
  const [dark, setDark] = useState(false);
  const [name, setName] = useState('Alice');
  return (
    <Tabs
      items={[
        {
          key: 'profile', label: 'Hồ sơ',
          children: (
            <div className="flex max-w-sm flex-col gap-3 pt-4">
              <Field label="Tên hiển thị" htmlFor="s-name">
                <Input id="s-name" value={name} onChange={setName} />
              </Field>
            </div>
          ),
        },
        {
          key: 'appearance', label: 'Giao diện',
          children: (
            <div className="flex items-center gap-3 pt-4">
              <Switch checked={dark} onChange={setDark} aria-label="Dark mode" />
              <span className="text-body text-ink2">Chủ đề tối</span>
            </div>
          ),
        },
      ]}
      onChange={(k) => console.log('tab:', k)}
    />
  );
}
```

## 10. HeroLanding — Button + Tag + Typography + Divider

```tsx
import { Button, Divider, Icon, Tag } from '@wakii/ui-kit';

export function HeroLanding() {
  return (
    <section className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
      <Tag icon={<Icon name="check-circle" size={12} />}>v1.0 — production ready</Tag>
      <h1 className="m-0 text-h1 font-semibold tracking-tight text-ink">
        Bộ quản lý công việc cho team của bạn
      </h1>
      <p className="max-w-md text-body text-ink2">
        Quản lý công việc, upload, hoạt động real-time — một bộ design system nhất quán.
      </p>
      <div className="flex gap-2">
        <Button type="primary" size="large">Bắt đầu</Button>
        <Button size="large">Xem demo</Button>
      </div>
      <Divider dashed>hoặc</Divider>
      <span className="text-meta text-ink3">alice@demo.local / demo-password</span>
    </section>
  );
}
```

---

## 11. DashboardGrid — Row/Col + Card + Statistic

```tsx
import { Card, Col, Row, Statistic, type StatisticProps } from '@wakii/ui-kit';

const STATS: { title: string; value: string; delta: string; tone: StatisticProps['valueStyle'] }[] = [
  { title: 'Người dùng', value: '1,284', delta: '+12%', tone: { color: 'var(--st-done)' } },
  { title: 'Tasks mở', value: '316', delta: '+5%', tone: { color: 'var(--st-doing)' } },
  { title: 'Quá hạn', value: '18', delta: '-3', tone: { color: 'var(--st-fail)' } },
  { title: 'Uptime', value: '99.98%', delta: '30 ngày', tone: { color: 'var(--ink)' } },
];

export function DashboardGrid() {
  return (
    <Row gutter={[16, 16]}>
      {STATS.map((s) => (
        <Col key={s.title} xs={24} md={12} xl={6}>
          <Card>
            <Statistic title={s.title} value={s.value} valueStyle={s.tone} suffix={s.delta} />
          </Card>
        </Col>
      ))}
      <Col span={24}>
        <Card title="Hoạt động tuần này">…chart/list body…</Card>
      </Col>
    </Row>
  );
}
```

Ghi chú: `gutter={[ngang, dọc]}` px chảy qua negative-margin + col padding (mechanic antd — không cần tự tính margin). Span **mobile-first**: `xs={24} md={12} xl={6}` = 1 cột mobile / 2 cột tablet / 4 cột desktop; bậc breakpoint không truyền thì kế thừa bậc dưới. Layout 1 trục không cần cột → dùng `Flex` (`gap` thang `small|middle|large`) cho gọn.

## 12. Popover hay Tooltip — chọn overlay nào

```tsx
import { Button, Popover, Tooltip } from '@wakii/ui-kit';

// Tooltip — hint TEXT thuần, hover/focus là đủ.
<Tooltip title="Đồng bộ qua gateway, retry 3 lần rồi vào DLQ">
  <Button icon>?</Button>
</Tooltip>

// Popover — nội dung GIÀU: title + ReactNode (list, link, action), trigger click.
<Popover
  trigger="click"
  title="Người thực hiện"
  content={
    <div className="flex w-56 flex-col gap-2">
      <span>Alice — admin</span>
      <span>Bob — member</span>
      <Button size="small" type="primary">+ Mời</Button>
    </div>
  }
>
  <Button>Quản lý (3)</Button>
</Popover>
```

Ghi chú: **Tooltip** = 1 câu hint ≤250px, đóng theo hover/focus, không tương tác được (`pointer-events-none`). **Popover** = panel `role="dialog"` có `title` divider + body ReactNode tự do; mở bằng `trigger` `hover|click|focus` (click dùng cho panel có action — hover làm Panel khó bấm); đóng bằng ESC + click ngoài + (controlled) `onOpenChange`. Popconfirm vẫn là lựa chọn riêng cho xác nhận OK/Huỷ — đừng dựng confirm bằng Popover.

---

## 13. CrudTableExpandable — Table expandable + Input.Search filter

Bảng CRUD có row chi tiết mở được (master-detail) + search filter dùng `Input.Search`.
Cột expander **tự inject** khi truyền `expandable` — không cần khai cột `expander` thủ công.

```tsx
import { useMemo, useState } from 'react';
import { Input, Table, Tag } from '@wakii/ui-kit';

type Task = { id: string; title: string; status: 'todo' | 'doing' | 'done'; priority: number; note: string };
const TASKS: Task[] = [
  { id: '1', title: 'Setup repo', status: 'done', priority: 1, note: 'Scaffold + CI xanh.' },
  { id: '2', title: 'Thêm endpoint tasks', status: 'doing', priority: 3, note: 'Drizzle + outbox pattern, chưa có retry.' },
  { id: '3', title: 'E2E saga demo', status: 'todo', priority: 2, note: 'Chạy qua gateway :8080, assert DLQ.' },
];

export function CrudTableExpandable() {
  const [q, setQ] = useState('');

  const filtered = useMemo(
    () => TASKS.filter((t) => t.title.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Search filter — onSearch fire khi Enter HOẶC click nút (antd parity) */}
      <div className="w-72">
        <Input.Search
          aria-label="Tìm task"
          placeholder="Tìm task…"
          enterButton          // true → nút primary icon search; hoặc enterButton="Tìm"
          onSearch={setQ}
        />
      </div>

      <Table
        columns={[
          { key: 'title', title: 'Task', sortable: true },
          { key: 'status', title: 'Trạng thái', render: (r: Task) => <Tag>{r.status}</Tag> },
          { key: 'priority', title: 'Ưu tiên', dataType: 'number', align: 'right' },
        ]}
        dataSource={filtered}
        rowKey="id"
        emptyMessage={<p className="p-4 text-body text-ink3">Không có task phù hợp.</p>}
        expandable={{
          // Row con chiếm full colspan, nền bg-s3 — render mọi ReactNode
          expandedRowRender: (r) => (
            <div className="text-label text-ink2">
              <p className="font-medium text-ink">{r.title}</p>
              <p className="mt-1">{r.note}</p>
            </div>
          ),
          defaultExpandedRowKeys: ['2'],               // mở sẵn lúc mount (uncontrolled)
          rowExpandable: (r) => r.status !== 'done',   // done không có chi tiết → không render nút chevron
        }}
      />
    </div>
  );
}
```

Ghi chú: `onSearch` là **trigger-style** (Enter/click) — muốn lọc live theo từng phím dùng `onChange` của input (hoặc `useDebounce` + `onChange` cho query đắt). Chevron xoay 90° khi mở, nút mang `aria-expanded`; row `rowExpandable: false` không render nút. `expandable` kết hợp được với `paginator` + `selectionMode="checkbox"` (state mở giữ qua trang). Filter-bar cần nổi khi scroll dài → bọc trong `Affix` (`offsetTop={0}`) ngay phía trên `Table`.

---

## 14. KanbanTaskBoard — KanbanBoard + Tag + Avatar + WIP-limit

```tsx
import { useState } from 'react';
import { Avatar, KanbanBoard, type KanbanColumnData } from '@wakii/ui-kit';

const INITIAL: KanbanColumnData[] = [
  {
    key: 'todo',
    title: 'Cần làm',
    cards: [
      { key: 't1', title: 'Sửa token contrast', description: 'Dark mode lệch 1 chỗ', tag: 'design' },
      { key: 't2', title: 'Outbox retry', left: <Avatar size={24}>B</Avatar> },
    ],
  },
  { key: 'doing', title: 'Đang làm', wipLimit: 2, cards: [{ key: 't3', title: 'Rate-limit gateway', tag: 'infra' }] },
  { key: 'done', title: 'Xong', cards: [] },
];

export function KanbanTaskBoard() {
  const [columns, setColumns] = useState(INITIAL);
  return (
    <KanbanBoard
      columns={columns}
      onCardMove={(cardKey, from, to, toIndex) => {
        setColumns((prev) => {
          const card = prev.flatMap((c) => c.cards).find((c) => c.key === cardKey);
          if (!card) return prev;
          return prev.map((col) => {
            const cards = col.cards.filter((c) => c.key !== cardKey);
            if (col.key === from) return { ...col, cards };
            if (col.key === to) {
              const next = [...cards];
              next.splice(toIndex, 0, card); // toIndex = vị trí SAU khi card rời nguồn
              return { ...col, cards: next };
            }
            return col;
          });
        });
      }}
    />
  );
}
```

Ghi chú: **controlled** — board không giữ state, mọi move (kéo chuột HOẶC keyboard) chỉ bắn `onCardMove(cardKey, fromColKey, toColKey, toIndex)`; `toIndex` là vị trí **cuối** trong cột đích sau khi card rời nguồn → dùng đúng công thức remove-then-splice như trên. `tag` tự render `Tag`, slot `left` cho `Avatar` assignee; card hoàn toàn khác → `renderCard(card, columnKey)`. Keyboard đầy đủ: Tab tới card → Space nhặt → ↑↓ đổi vị trí, ←→ đổi cột → Enter thả, Esc hủy — aria-live tự thông báo "Đã chuyển X tới cột Y, vị trí Z". Cột `wipLimit` đầy **từ chối** drop từ cột khác (viền `border-st-fail` + aria-live) nhưng vẫn cho đổi thứ tự trong chính cột đó (count không đổi). ⚠️ Native HTML5 DnD **không hỗ trợ touch** (mobile) — hướng nâng cấp tương lai là peer-dep dnd-kit, đừng tự viết pointer engine.

---

## 15. WeeklyTimesheet — Timesheet log giờ tuần + Statistic tổng

```tsx
import { useMemo, useState } from 'react';
import { Card, Statistic, Timesheet, type TimesheetRow } from '@wakii/ui-kit';

// values ĐÚNG 7 phần tử theo cột Thứ 2 → Chủ nhật; null = ô trống
const INITIAL_ROWS: TimesheetRow[] = [
  { key: 't1', label: 'Task #101', meta: 'Design system', values: [8, 8, 8, 8, 8, null, null] },
  { key: 't2', label: 'Task #102', meta: 'Gateway', values: [1, 2, 0.5, null, null, null, null] },
  { key: 't3', label: 'Task #103', meta: 'e2e', values: [null, null, null, 4, 6, 3, null] },
];

export function WeeklyTimesheetPage() {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [week, setWeek] = useState(new Date()); // bất kỳ ngày nào — component tự chuẩn về Thứ 2

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + r.values.reduce((a, v) => a + (v ?? 0), 0), 0),
    [rows],
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Statistic title="Tổng giờ tuần này" value={total} suffix="h" />
      </Card>
      <Timesheet
        rows={rows}
        week={week}
        editable
        locale="vi"
        onWeekChange={setWeek}
        onCellChange={(rowKey, dayIndex, value) =>
          setRows((prev) =>
            prev.map((r) =>
              r.key === rowKey
                ? { ...r, values: r.values.map((v, i) => (i === dayIndex ? value : v)) }
                : r,
            ),
          )
        }
      />
    </div>
  );
}
```

Ghi chú: tuần **luôn bắt đầu Thứ 2** cả vi/en — `week` nhận bất kỳ Date nào trong tuần; nav prev/next bắn `onWeekChange` (Date = Thứ 2 tuần mới) và grid tự replay fade-in. Ô nhập clamp **0–24, step 0.5**; xoá ô → `onCellChange(…, null)` — state `rows` là nguồn sự thật, footer tổng cột + grand tự tính lại (bỏ `editable` → readonly text). Cột T7/CN đã nền nhẹ sẵn; `locale="en"` đổi headers + nhãn tuần sang `Oct 19–25, 2026`. Đang fetch → `loading` thay thân bảng bằng skeleton (header + nhãn tuần giữ nguyên). Tổng tuần trên `Statistic` tính consumer-side từ `rows` (tabular-nums built in).

## 16. LandingAlive — Reveal + Parallax hero + CountUp KPI (Statistic + Grid)

```tsx
import { CountUp, Parallax, Reveal, Col, Row, Statistic } from '@wakii/ui-kit';

type Kpi = { title: string; value: number; decimals?: number; suffix: string };

const KPIS: Kpi[] = [
  { title: 'Tasks completed', value: 1284, suffix: 'tasks' },
  { title: 'On-time rate', value: 96.4, decimals: 1, suffix: '%' },
  { title: 'Active teams', value: 327, suffix: 'teams' },
];

export function LandingAlive() {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero — ảnh trôi chậm hơn trang (speed 0.3 + scale nhẹ); tự tắt khi reduced-motion */}
      <Parallax speed={0.3} scale className="overflow-hidden rounded-xl">
        <img src="/hero.jpg" alt="Product hero" className="aspect-video w-full object-cover" />
      </Parallax>

      {/* KPI row — card trôi vào lệch pha, số đếm ease-out trong Statistic */}
      <Row gutter={[24, 24]}>
        {KPIS.map((kpi, i) => (
          <Col key={kpi.title} xs={24} md={8}>
            <Reveal direction="up" delay={i * 150}>
              <div className="h-full rounded-xl border border-line bg-s1 p-5">
                <Statistic
                  title={kpi.title}
                  value={<CountUp value={kpi.value} decimals={kpi.decimals} />}
                  suffix={kpi.suffix}
                />
              </div>
            </Reveal>
          </Col>
        ))}
      </Row>

      {/* Feature pair — vào lần lượt từ 2 bên */}
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal direction="left">
          <div className="rounded-xl border border-line bg-s1 p-5 text-body text-ink2">
            Real-time qua Kafka — activity feed cập nhật tức thì.
          </div>
        </Reveal>
        <Reveal direction="right">
          <div className="rounded-xl border border-line bg-s1 p-5 text-body text-ink2">
            Module Federation — remote độc lập deploy, shell ghép runtime.
          </div>
        </Reveal>
      </div>
    </div>
  );
}
```

Ghi chú: **an toàn a11y có sẵn** — `Parallax` tự tắt khi `prefers-reduced-motion` (qua `useMediaQuery`), animation Reveal/CountUp rơi về tức thì nhờ block global; không cần nhánh UI riêng. `Reveal once` mặc định chỉ chạy 1 lần (IO disconnect sau khi vào) — thêm `once={false}` nếu muốn replay khi cuộn lại. `CountUp` đổi `value` giữa chừng sẽ animate tiếp **từ số đang hiển thị** (hợp poll/refresh số liệu); `decimals`/`format` định dạng hiển thị (`format={(n) => n.toLocaleString('vi-VN')}` cho grouping). `Parallax` chỉ track cửa sổ — đặt ngoài container `overflow: hidden` cuộn riêng. Tất cả 0 deps, chỉ animate `transform`/`opacity` (GPU).

## 17. DynamicEmailsForm — useForm + useFieldArray (mảng động + zod validate từng row)

Form động kiểu antd `Form.List`: danh sách email thêm/xoá/đảo, zod validate **từng row** qua
path lồng `emails.<i>.email`. `nameAt` đặt name đúng path → focus-first-invalid của
`form.handleSubmit` tự vào đúng ô sai.

```tsx
import { useState } from 'react';
import { z } from 'zod';
import { Button, Field, Input, useForm, useFieldArray } from '@wakii/ui-kit';

const schema = z.object({
  emails: z
    .array(z.object({ email: z.string().email('Email không hợp lệ') }))
    .min(1, 'Cần ít nhất 1 email'),
});
type InviteForm = z.infer<typeof schema>;
type EmailRow = InviteForm['emails'][number];

export function DynamicEmailsForm({ onInvite }: { onInvite: (emails: string[]) => Promise<void> }) {
  const form = useForm<InviteForm>({ schema, mode: 'onChange', initialValues: { emails: [{ email: '' }] } });
  const arr = useFieldArray<InviteForm, 'emails', EmailRow>(form, 'emails');
  const [sending, setSending] = useState(false);

  return (
    <form
      className="flex w-96 flex-col gap-2"
      onSubmit={form.handleSubmit(async (d) => {
        setSending(true);
        try {
          await onInvite(d.emails.map((r) => r.email));
        } finally {
          setSending(false);
        }
      })}
    >
      {arr.fields.map((row, i) => (
        <Field key={i} label={i === 0 ? 'Email người nhận' : undefined} htmlFor={`inv-${i}`}
          error={form.errors[`emails.${i}.email`]}>
          <div className="flex gap-2">
            <Input id={`inv-${i}`} name={arr.nameAt(i, 'email')} placeholder="name@company.vn"
              value={row.email} invalid={!!form.errors[`emails.${i}.email`]}
              onChange={(e) => arr.update(i, { email: e.target.value })} />
            <Button type="text" aria-label={`Xoá email ${i + 1}`} onClick={() => arr.remove(i)}>×</Button>
          </div>
        </Field>
      ))}
      <div className="flex items-center gap-2">
        <Button type="default" onClick={() => arr.append({ email: '' })}>+ Thêm email</Button>
        <Button type="text" disabled={arr.count < 2} onClick={() => arr.swap(0, arr.count - 1)}>Đảo đầu–cuối</Button>
        <Button htmlType="submit" type="primary" loading={sending}>Gửi mời</Button>
      </div>
    </form>
  );
}
```

Ghi chú: **path lồng** — zod issues tự map thành `errors['emails.<i>.email']` (useForm join
`'.'`), `Field error=` đọc đúng key đó. **Lỗi đi theo row**: mỗi op cấu trúc (`append`/
`remove`/`move`/`swap`/`update`) rebuild errors từ snapshot mới — xoá row giữa thì lỗi dồn
index đúng. **`mode: 'onChange'`** để validate từng row khi gõ (lỗi tự tắt khi sửa đúng);
`nameAt(i, key)` đặt name attr → submit sai tự focus ô đầu tiên. Mỗi event chỉ gọi **1 op**
(hook thuần closure — 2 op liên tiếp trong 1 handler thì op sau thấy state cũ). Reorder
nhiều row: `move(from, to)` là insert-at kiểu RHF; `swap` đổi chỗ 2 row.

---

## 18. NavAppĐaCấp — Menubar vs MegaMenu vs SlideMenu: khi nào cái nào

Ba mức nav ngang — chọn theo ĐỘ SÂU + ĐỘ RỘNG nội dung:

| | `Menubar` | `MegaMenu` | `SlideMenu` |
|---|---|---|---|
| Cấu trúc | dropdown **1 cấp** gọn | panel **multi-column** (group = cột → leaf) | các **cấp trượt ngang**, đệ quy không giới hạn |
| Khi nào | app header ít mục, mỗi mục vài action | landing/app header nhiều NHÓM chức năng (sản phẩm, tài nguyên, quản trị) | panel hẹp / mobile / hamburger / cây phân loại sâu |
| Mở/đóng | hover | hover HOẶC click · ESC/click-ngoài/leave | click vào cấp · back bar / ESC |
| Không dùng khi | cần panel nhóm nhiều cột → MegaMenu | không gian hẹp (mobile) → SlideMenu | top bar desktop nhiều cột song song → MegaMenu |

```tsx
import { useState } from 'react';
import { Card, MegaMenu, SlideMenu, type MegaMenuItem, type SlideMenuItem } from '@wakii/ui-kit';

const MEGA: MegaMenuItem[] = [
  {
    key: 'product',
    label: 'Sản phẩm',
    children: [
      {
        key: 'work',
        label: 'Workspace',
        items: [
          { key: 'board', label: 'Board' },
          { key: 'list', label: 'List view' },
        ],
      },
      {
        key: 'insight',
        label: 'Insights',
        items: [
          { key: 'charts', label: 'Charts' },
          { key: 'reports', label: 'Reports' },
        ],
      },
    ],
  },
  { key: 'pricing', label: 'Giá', onClick: () => console.log('pricing') },
];

const SLIDE: SlideMenuItem[] = [
  {
    key: 'projects',
    label: 'Dự án',
    children: [
      {
        key: 'active',
        label: 'Đang chạy',
        children: [{ key: 'vu53', label: 'VU-53 redesign' }],
      },
      { key: 'archived', label: 'Lưu trữ' },
    ],
  },
  { key: 'settings', label: 'Cài đặt' },
];

export function NavAppDaCap({ isMobile }: { isMobile: boolean }) {
  const [lastPick, setLastPick] = useState('—');
  return isMobile ? (
    // Mobile/panel hẹp: SlideMenu — cấp sâu trong footer drawer
    <Card title="Menu">
      <SlideMenu items={SLIDE} ariaLabel="Menu chính" className="w-full" />
    </Card>
  ) : (
    // Desktop: MegaMenu làm top bar — nhóm chức năng duyệt theo cột
    <Card title="Sản phẩm & more">
      <MegaMenu
        items={MEGA.map((m) =>
          m.key === 'pricing'
            ? { ...m, onClick: () => setLastPick('pricing') }
            : m,
        )}
        className="rounded-lg"
      />
      <p className="m-0 mt-3 text-meta text-ink3">Đã chọn: {lastPick}</p>
    </Card>
  );
}
```

Ghi chú: cả 3 cùng ngôn ngữ nav — item `key`/`label`/`onClick`, `danger` đỏ, đóng bằng ESC.
MegaMenu panel là `role=menu` + `role=menuitem`, trigger có `aria-expanded`; SlideMenu trang ẩn
`inert` + `aria-hidden` (không phá tab order), back bar kèm nhãn cấp cha. Menubar/MegaMenu mở
theo hover (desktop) — với touch cứ click. Cần nav đa cấp DỌC trong sidebar → dùng `Menu`
(đa cấp) hoặc `Sidebar` + `MenuCompactContext`, không nhét SlideMenu vào sidebar.

## 19. MotionComposable — Transition + Reveal + Parallax cộng hưởng trên landing

```tsx
import { useState } from 'react';
import { Button, CollapseTransition, CountUp, Parallax, Reveal, Row, Col, Statistic } from '@wakii/ui-kit';

// Mỗi motion primitiveOWN đúng 1 trục, không giành transform trên CÙNG element:
// Parallax = scroll · Reveal = viewport-enter · Transition = state in/out.
// Kết hợp bằng CÁCH BỌC NESTED (mỗi primitive một element riêng).

export function LandingMotionComposable() {
  const [openFeature, setOpenFeature] = useState(false);

  return (
    <div className="flex flex-col gap-12">
      {/* 1) Hero — Parallax trôi chậm khi scroll (self-tắt khi reduced-motion) */}
      <Parallax speed={0.3} scale className="overflow-hidden rounded-xl">
        <img src="/hero.jpg" alt="Product hero" className="aspect-video w-full object-cover" />
      </Parallax>

      {/* 2) KPI — Reveal stagger khi cuộn tới + CountUp đếm ease-out */}
      <Row gutter={[24, 24]}>
        {[
          { title: 'Tasks shipped', value: 1284, suffix: '' },
          { title: 'Uptime', value: 99.95, decimals: 2, suffix: '%' },
          { title: 'Teams onboard', value: 327, suffix: '+' },
        ].map((kpi, i) => (
          <Col key={kpi.title} xs={24} md={8}>
            <Reveal direction="up" delay={i * 150}>
              <div className="h-full rounded-xl border border-line bg-s1 p-5">
                <Statistic
                  title={kpi.title}
                  value={<CountUp value={kpi.value} decimals={kpi.decimals} />}
                  suffix={kpi.suffix}
                />
              </div>
            </Reveal>
          </Col>
        ))}
      </Row>

      {/* 3) Feature card — Reveal đưa card vào, CollapseTransition mở details (state do user) */}
      <Reveal direction="left" className="max-w-xl">
        <div className="rounded-xl border border-line bg-s1 p-5">
          <h3 className="m-0 text-h3 font-semibold text-ink">Zero-config motion</h3>
          <p className="mt-1 text-body text-ink2">
            Scroll-reveal từ Reveal, chiều cao đàn hồi từ CollapseTransition — hai primitive,
            hai element, không xung đột transform.
          </p>
          <Button size="small" onClick={() => setOpenFeature((o) => !o)}>
            {openFeature ? 'Hide details' : 'Show details'}
          </Button>
          {/* padding nằm trong children — tầng overflow-hidden phải clip sạch */}
          <CollapseTransition in={openFeature}>
            <p className="m-0 pt-3 text-body text-ink2">
              CollapseTransition unmount sau khi exit animation chạy xong — DOM sạch,
              không banner ẩn chiếm chỗ.
            </p>
          </CollapseTransition>
        </div>
      </Reveal>
    </div>
  );
}
```

Ghi chú: quy tắc **composable** — (1) mỗi primitive bọc một element riêng, KHÔNG gộp 2 hiệu ứng lên cùng div (transform/opacity ghi đè nhau); (2) `Reveal` quản entrance, `Transition`/`CollapseTransition` quản state in/out do user, `Parallax` quản scroll — trục nào về nó; (3) reduced-motion tắt cả ba nhờ block global (`Parallax` còn tự ngắt listener qua `useMediaQuery`). `CollapseTransition` là tên barrel của `Collapse` trong `ui/transition` (trùng tên `Collapse` — xem AGENTS.md nhóm Theming & Motion).

---


## Bảng "khi nào dùng" — nhóm Primitives + Navigation

| Component | Khi nào dùng | Đừng dùng khi |
|---|---|---|
| `Alert` | Thông báo ngữ cảnh nằm trong trang (filled mặc định) | toast tạm → dùng `message` |
| `Avatar` / `AvatarGroup` | Đại diện user; nhóm chồng + max "+N" | — |
| `Badge` | Số đếm/ trạng thái nhỏ trên icon, pill delta | nội dung dài → Tag |
| `BusyBox` | Bọc khối đang loading (thay Skeleton thủ công) | loading cả trang → Skeleton page |
| `Button` | Mọi action; `htmlType` mới là type HTML; `loading` chặn double-submit | link điều hướng → `<Link>`/nav |
| `Breadcrumb` | Đường phân cấp trang chi tiết | nav chính → Menu/Tabs |
| `Card` | Khối nội dung có viền/đề (anchor: rounded + title/extra) | layout vô hình → div |
| `ContextMenu` | Menu chuột phải | menu thường → Dropdown/Menu |
| `Divider` | Phân cách nội dung (ngang/dọc, text, dashed) | — |
| `Dropdown` | Menu gắn trigger bất kỳ; `---` làm separator | menu đa cấp sidebar → Menu |
| `EmptyState` | Danh sách/region rỗng (title + action) | lỗi → Result |
| `Icon` | Mọi glyph (48 tên primeicons) | — |
| `Image` | Ảnh có preview overlay | avatar → Avatar |
| `Input` / `Textarea` | Ô nhập; `invalid` + `Field` = form | số → InputNumber |
| `List` | Danh sách item + loading/empty/pagination | bảng dữ liệu → Table |
| `Menu` | Nav đa cấp sidebar (vertical) / thanh (horizontal) | action đơn → Dropdown |
| `Menubar` | Thanh menu desktop hover | trong trang → Tabs |
| `Modal` | Xác nhận/form chặn tương tác | phi-chặn → Drawer/Popconfirm |
| `Pagination` | Phân trang client-side | infinite scroll |
| `Popconfirm` | Xác nhận nhanh trước action nguy hiểm | form dài → Modal |
| `Segmented` | Đổi view cùng ngữ cảnh | nav routing → Tabs/TabMenu |
| `Sidebar` | Khung app chính, collapse icon-only | landing → nav thường |
| `Skeleton` | Placeholder trước khi có data | — |
| `Space` | Gap flex nhanh | layout phức tạp → grid |
| `Spinner` | Loading điểm lẻ | khối → Skeleton/BusyBox |
| `SplitButton` | Action chính + biến thể phụ | 2 action ngang hàng → 2 Button |
| `Steps` | Tiến trình nhiều bước | trạng thái đơn → Tag/Progress |
| `TabMenu` | Nav dạng tab (đổi view) | nội dung trong tab → Tabs |
| `Tabs` | Chia nội dung cùng trang | nav routing → TabMenu |
| `Tag` | Nhãn trạng thái/phân loại | số đếm → Badge |
| `Timeline` | Chuỗi sự kiện theo thời gian | — |
| `Toolbar` | Cụm công cụ trên cùng hàng | — |
| `Tooltip` | Hint khi hover/focus icon | nội dung dài → Popover (backlog) |

*Nhóm Forms / Data Display / Feedback — worker khác bổ sung sau.*
