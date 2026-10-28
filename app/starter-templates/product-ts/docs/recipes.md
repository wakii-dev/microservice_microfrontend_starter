# AI Recipes — 20 công thức UI dùng `@wakii/ui-kit`

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

## 20. ProductPresetFeature — CRUD feature theo containers/ui/hooks/api (product preset)

**Khi nào dùng:** app scaffold từ `create-wakii-app --preset product` (hoặc `admin` — cùng data layer,
thêm sidebar/login) và cần thêm 1 feature CRUD có backend. KHÔNG viết trang "một file to": copy cấu
trúc `features/tasks/` của template `product-ts` (create-wakii-app 0.2.3), tách đúng 6 lớp —
`eslint-plugin-boundaries` trong scaffold sẽ chặn mọi import đi lệch tầng. (Preset `minimal` không
mang data layer → recipe này không áp dụng trực tiếp.) Code dưới lấy NGUYÊN tên file/hàm từ
`features/tasks/` — feature mới = copy + đổi `tasks` → `<tên>`.

### Cấu trúc 6 file tạo mới

```text
features/<tên>/
├── index.ts           # CỔNG DUY NHẤT ra ngoài — chỉ export containers + ui
├── schema/schema.ts   # zod: type TS + parse response + validate form — sửa shape ở ĐÂY DUY NHẤT
├── api/<tên>-api.ts   # fetch qua shared client + zod parse — THUẦN TS, cấm react
├── hooks/             # useTasks (query + mutation optimistic), useTaskForm (useForm kit)
├── containers/        # nơi DUY NHẤT nối hooks/api → ui qua props
└── ui/                # presentational — nhận props, KHÔNG tự fetch
```

Thứ tự viết: **schema → api → hooks → ui → containers → index** (hợp đồng dữ liệu trước, code theo
sau); test đặt cạnh file `*.test.ts(x)`.

`schema/schema.ts` — zod là nguồn sự thật (runtime parse + TS type + validate form):

```ts
import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'doing', 'done']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  status: taskStatusSchema,
  assignee: z.string().nullable(),
  createdAt: z.string(),
});
export type Task = z.infer<typeof taskSchema>;

/** Form tạo task — schema zod truyền thẳng vào useForm. */
export const taskFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bắt buộc').max(120, 'Tiêu đề tối đa 120 ký tự'),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

/** Chu kỳ trạng thái khi toggle: todo → doing → done → todo. */
export function nextTaskStatus(status: TaskStatus): TaskStatus {
  return status === 'todo' ? 'doing' : status === 'doing' ? 'done' : 'todo';
}

/** Nhãn tiếng Việt cho status — dùng chung Table/Tag. */
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  doing: 'Đang làm',
  done: 'Xong',
};
```

`api/tasks-api.ts` — call qua shared client rồi PARSE zod trước khi trả; data sai shape vỡ ở ranh
giới api, không lan vào UI:

```ts
import { createQueryKeys } from '@/shared/api/query-keys';
import { apiFetch } from '@/shared/api/client';
import {
  nextTaskStatus,
  taskFormSchema,
  taskSchema,
  type Task,
  type TaskFormValues,
  type TaskStatus,
} from '../schema/schema';

/** Keys TanStack Query của resource tasks — dùng trong hooks (useTasks…). */
export const tasksKeys = createQueryKeys('tasks');

const TASKS_PATH = '/tasks';

export const tasksApi = {
  async list(): Promise<Task[]> {
    const raw = await apiFetch<unknown>(TASKS_PATH);
    return taskSchema.array().parse(raw);
  },

  async create(values: TaskFormValues): Promise<Task> {
    const raw = await apiFetch<unknown>(TASKS_PATH, { method: 'POST', body: taskFormSchema.parse(values) });
    return taskSchema.parse(raw);
  },

  /** Đổi task sang trạng thái tiếp theo (todo → doing → done → todo). */
  async toggleStatus(task: Task): Promise<Task> {
    const next: TaskStatus = nextTaskStatus(task.status);
    const raw = await apiFetch<unknown>(`${TASKS_PATH}/${task.id}`, { method: 'PATCH', body: { status: next } });
    return taskSchema.parse(raw);
  },

  /** DELETE trả 204 → client trả undefined. */
  async remove(id: Task['id']): Promise<void> {
    await apiFetch<unknown>(`${TASKS_PATH}/${id}`, { method: 'DELETE' });
  },
};
```

`hooks/useTasks.ts` — TanStack Query chuẩn: toggle OPTIMISTIC (onMutate snapshot → onError rollback
→ onSettled re-sync):

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, tasksKeys } from '../api/tasks-api';
import { nextTaskStatus, type Task } from '../schema/schema';

export function useTasks() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tasksKeys.lists(), queryFn: () => tasksApi.list() });

  const toggle = useMutation({
    mutationFn: (task: Task) => tasksApi.toggleStatus(task),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });
      const previous = queryClient.getQueryData<Task[]>(tasksKeys.lists());
      queryClient.setQueryData<Task[]>(tasksKeys.lists(), (old) =>
        old?.map((t) => (t.id === task.id ? { ...t, status: nextTaskStatus(task.status) } : t)),
      );
      return { previous };
    },
    onError: (_error, _task, context) => {
      // Server chối → trả lại đúng trạng thái user đã thấy trước khi bấm.
      if (context?.previous) queryClient.setQueryData(tasksKeys.lists(), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
    },
  });

  return { query, toggle };
}
```

Form hook mỏng — useForm kit (recipe 1) + schema của feature:

```ts
import { useForm } from '@wakii/ui-kit';
import { taskFormSchema, type TaskFormValues } from '../schema/schema';

export function useTaskForm() {
  return useForm<TaskFormValues>({ schema: taskFormSchema, initialValues: { title: '' }, mode: 'onSubmit' });
}
```

`ui/` — THUẦN props, không import hooks/api (`TaskItem` — hàng toggle + tiêu đề — xem template):

```tsx
import { useState } from 'react';
import {
  Alert,
  Button,
  Popconfirm,
  Table,
  Tag,
  Text,
  type TableColumn,
} from '@wakii/ui-kit';
import { TASK_STATUS_LABEL, type Task, type TaskStatus } from '../schema/schema';
import { TaskItem } from './TaskItem';

export interface TasksPageProps {
  tasks: Task[];
  loading?: boolean;
  /** Lỗi load list (nếu có) — hiện Alert thay bảng. */
  error?: string | null;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  deleting?: boolean;
}

const STATUS_TAG_CLS: Record<TaskStatus, string> = {
  todo: 'text-ink2',
  doing: 'text-st-doing',
  done: 'text-st-done',
};

export function TasksPage({ tasks, loading = false, error, onToggle, onDelete, deleting = false }: TasksPageProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  if (error) {
    return <Alert type="error" message="Không tải được danh sách task" description={error} />;
  }

  const columns: TableColumn<Task>[] = [
    {
      key: 'task',
      title: 'Task',
      render: (row: Task) => <TaskItem task={row} onToggle={onToggle} />,
    },
    { key: 'assignee', title: 'Người thực hiện', render: (row: Task) => <Text type="secondary">{row.assignee ?? '—'}</Text> },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row: Task) => (
        <Tag className={STATUS_TAG_CLS[row.status]}>{TASK_STATUS_LABEL[row.status]}</Tag>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (row: Task) => (
        <Popconfirm
          open={confirmingId === row.id}
          title={`Xoá "${row.title}"?`}
          onConfirm={() => {
            onDelete(row);
            setConfirmingId(null);
          }}
          onCancel={() => setConfirmingId(null)}
          okText="Xoá"
          cancelText="Giữ"
        >
          <Button
            type="text"
            size="small"
            disabled={deleting}
            aria-label={`Xoá task ${row.title}`}
            onClick={() => setConfirmingId(row.id)}
          >
            Xoá
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table columns={columns} dataSource={tasks} rowKey="id" loading={loading} />
  );
}
```

```tsx
import type { FormEvent } from 'react';
import { Button, Field, Input, type FormInstance } from '@wakii/ui-kit';
import type { TaskFormValues } from '../schema/schema';

export interface TaskFormProps {
  form: FormInstance<TaskFormValues>;
  submitting?: boolean;
  /** Được gọi SAU khi schema validate pass (giá trị đã parse). */
  onSubmit: (values: TaskFormValues) => void;
}

export function TaskForm({ form, submitting = false, onSubmit }: TaskFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.handleSubmit(onSubmit);
  };

  return (
    <form className="flex items-start gap-2" onSubmit={handleSubmit} noValidate>
      <Field label="Task mới" htmlFor="task-title" error={form.errors.title} className="flex-1">
        <Input
          id="task-title"
          name="title"
          placeholder="Ví dụ: Nối API thật"
          value={form.values.title}
          invalid={!!form.errors.title}
          onChange={form.handleChange('title')}
          onBlur={form.handleBlur('title')}
        />
      </Field>
      <Button htmlType="submit" type="primary" loading={submitting} disabled={submitting}>
        Thêm
      </Button>
    </form>
  );
}
```

`containers/` — nối data ↔ UI, không render layout gì thêm:

```tsx
// TasksPageContainer — useTasks (query + toggle optimistic) + mutation xoá
// (useMutation + invalidate) rồi bơm props cho ui/TasksPage.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@wakii/ui-kit';
import { tasksApi, tasksKeys } from '../api/tasks-api';
import type { Task } from '../schema/schema';
import { useTasks } from '../hooks/useTasks';
import { TasksPage } from '../ui/TasksPage';

export function TasksPageContainer() {
  const queryClient = useQueryClient();
  const { query, toggle } = useTasks();

  const remove = useMutation({
    mutationFn: (task: Task) => tasksApi.remove(task.id),
    onSuccess: () => {
      message.success('Đã xoá task');
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
    },
    onError: () => message.error('Xoá task thất bại — thử lại nhé'),
  });

  return (
    <TasksPage
      tasks={query.data ?? []}
      loading={query.isPending}
      error={query.isError ? (query.error instanceof Error ? query.error.message : String(query.error)) : null}
      onToggle={(task) => toggle.mutate(task)}
      onDelete={(task) => remove.mutate(task)}
      deleting={remove.isPending}
    />
  );
}
```

```tsx
// TaskFormContainer — nối useTaskForm (form state + zod) với mutation create:
// submit pass schema → POST → invalidate list → reset form + toast.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@wakii/ui-kit';
import { tasksApi, tasksKeys } from '../api/tasks-api';
import { useTaskForm } from '../hooks/useTaskForm';
import { TaskForm } from '../ui/TaskForm';

export function TaskFormContainer() {
  const form = useTaskForm();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (values: { title: string }) => tasksApi.create(values),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      form.reset();
      message.success(`Đã thêm "${created.title}"`);
    },
    onError: (error) => message.error(error instanceof Error ? error.message : 'Thêm task thất bại'),
  });

  return <TaskForm form={form} submitting={create.isPending} onSubmit={(values) => create.mutate(values)} />;
}
```

`index.ts` — cửa vào duy nhất của feature (import lách vào trong = lỗi lint):

```ts
export { TasksPageContainer } from './containers/TasksPageContainer';
export { TaskFormContainer } from './containers/TaskFormContainer';
export { TasksPage, type TasksPageProps } from './ui/TasksPage';
export { TaskForm, type TaskFormProps } from './ui/TaskForm';
export { TaskItem, type TaskItemProps } from './ui/TaskItem';
```

### Quy tắc boundary — ai được import ai

Enforce bằng `eslint-plugin-boundaries` trong scaffold (default **disallow** — luật không liệt kê
= cấm), vi phạm = lỗi `pnpm lint` chặn commit. File `*.test.ts(x)` là ngoại lệ duy nhất được
import tự do.

| Từ ↓ | ✅ Được import | ❌ Bị chặn | Vì sao |
|---|---|---|---|
| `routes/` | `features/*/index.ts`, `shared/ui`, `shared/lib`, `routes/` khác | thẳng vào `containers/`, `hooks/`, `api/` | feature chỉ có 1 cửa — đổi internals không vỡ trang |
| `containers/` | `hooks/`, `api/`, `schema/`, `ui/`, `shared/*` | ngược lên `routes/`, `mocks/` | nơi DUY NHẤT chạm data layer |
| `hooks/` | `api/`, `schema/`, `shared/api`, `shared/lib` | `ui/` | hook trả data/state — render là việc của `ui/` |
| `ui/` | `schema/`, `shared/ui`, `shared/lib` | `containers/`, `hooks/`, `api/` | UI dumb nhận props → render thuần |
| `api/` | `schema/`, `shared/api`, `shared/lib`, `env.ts` | `react`/`react-dom` + mọi UI | tầng thuần TS — chạy được trong test node không cần DOM |
| `schema/` | `shared/lib` | mọi tầng data | nguồn sự thật dữ liệu, mọi tầng đọc được |
| `mocks/` | chỉ nội bộ `mocks/` | schema của app | handler đóng vai server — trả data THÔ, client mới parse |

Vì sao tách đến mức này: (1) **test tách tầng** — ui test truyền props cứng không cần mock API,
hooks test mock module api không cần network, api test là tầng DUY NHẤT cần MSW (xem phần test
dưới); (2) **UI dumb tái dùng** — `TasksPage` render được với BẤT KỲ nguồn `Task[]` nào (MSW,
backend thật, fixture), không khóa vào cách fetch.

### Wire route + NavLink + ProtectedRoute

```tsx
// routes/tasks.tsx — trang DÙNG feature, import QUA CỔNG index (không lách vào trong)
import { TasksPageContainer, TaskFormContainer } from '@/features/tasks';
import { PageHeader } from '@/shared/ui/PageHeader';

export default function TasksPageRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tasks" description="CRUD theo preset product" />
      <TaskFormContainer />
      <TasksPageContainer />
    </div>
  );
}
```

```tsx
// app/router.tsx — 1) lazy page → 2) khai báo <Route> → 3) NavLink vào header nav
const TasksPageRoute = lazy(() => import('@/routes/tasks'));

<NavLink
  to="/tasks"
  className={({ isActive }) =>
    `rounded-2 px-2.5 py-1 text-label no-underline transition-colors ${isActive ? 'text-ink' : 'text-ink2 hover:text-ink'}`
  }
>
  Tasks
</NavLink>

<Route element={<TasksPageRoute />} path="/tasks" />

{/* Route cần auth — bọc ProtectedRoute (điều kiện demo: localStorage; thay bằng check token thật) */}
<Route
  path="/private"
  element={
    <ProtectedRoute isAuthenticated={demoSignedIn()}>
      <PrivatePage />
    </ProtectedRoute>
  }
/>
```

`ProtectedRoute` (`@/app/protected-route`): chưa thoả `isAuthenticated` → `<Navigate replace
to={fallback}>` (mặc định `'/'`) kèm `state.from` để trang login quay lại đúng chỗ sau khi đăng nhập.

### MSW — handler giả + query-keys factory

Dev chạy KHÔNG cần backend: worker MSW (bật trong dev qua `main.tsx`) chặn fetch. Thêm resource
mới = thêm store + handlers vào `src/mocks/`:

```ts
// mocks/tasks.db.ts — store GIẢ trong bộ nhớ, reset mỗi lần reload. Data THÔ
// (không import schema app — handler đóng vai server, client mới parse/validate).
export interface TaskRow {
  id: number;
  title: string;
  status: 'todo' | 'doing' | 'done';
  assignee: string | null;
  createdAt: string;
}

let nextId = 4;

export const tasksDb: TaskRow[] = [
  { id: 1, title: 'Đọc AGENTS.md', status: 'done', assignee: 'alice', createdAt: '2026-01-10T08:00:00.000Z' },
  { id: 2, title: 'Thêm feature đầu tiên', status: 'doing', assignee: 'bob', createdAt: '2026-01-11T09:30:00.000Z' },
];

export function insertTask(row: Omit<TaskRow, 'id' | 'createdAt'>): TaskRow {
  const task: TaskRow = { ...row, id: nextId++, createdAt: new Date().toISOString() };
  tasksDb.unshift(task);
  return task;
}
```

```ts
// mocks/handlers.ts — CRUD giả (msw). Wildcard '*/tasks' khớp CẢ fetch relative
// (dev, origin = vite server) lẫn absolute khi đặt VITE_API_URL nối backend thật.
import { delay, http, HttpResponse } from 'msw';
import { insertTask, tasksDb, type TaskRow } from './tasks.db';

const TASKS_PATTERN = '*/tasks';

export const handlers = [
  http.get(TASKS_PATTERN, async () => {
    await delay(150); // mô phỏng độ trễ mạng — để skeleton/loading có vai diễn
    return HttpResponse.json(tasksDb);
  }),

  http.post(TASKS_PATTERN, async ({ request }) => {
    const body = (await request.json()) as Partial<Pick<TaskRow, 'title' | 'status' | 'assignee'>>;
    if (!body.title) {
      return HttpResponse.json({ message: 'Thiếu tiêu đề task.' }, { status: 422 });
    }
    const created = insertTask({ title: body.title, status: body.status ?? 'todo', assignee: body.assignee ?? null });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`${TASKS_PATTERN}/:id`, async ({ request, params }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<Pick<TaskRow, 'status'>>;
    const task = tasksDb.find((t) => t.id === id);
    if (!task) return HttpResponse.json({ message: `Không thấy task #${id}.` }, { status: 404 });
    if (body.status) task.status = body.status;
    return HttpResponse.json(task);
  }),

  http.delete(`${TASKS_PATTERN}/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = tasksDb.findIndex((t) => t.id === id);
    if (index === -1) return HttpResponse.json({ message: `Không thấy task #${id}.` }, { status: 404 });
    tasksDb.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
```

Query-key KHÔNG hardcode — dùng factory có sẵn `shared/api/query-keys.ts` (pattern TKDodo,
invalidate hợp theo tiền tố):

```ts
import { createQueryKeys } from '@/shared/api/query-keys';

export const tasksKeys = createQueryKeys('tasks');
// tasksKeys.all         → ['tasks']                  — gốc resource
// tasksKeys.lists()     → ['tasks', 'list']          — invalidate mọi list
// tasksKeys.list(f)     → ['tasks', 'list', f]       — cache riêng per filter-set
// tasksKeys.detail(id)  → ['tasks', 'detail', id]
```

### Test mẫu 3 loại — mỗi tầng mock đúng tầng của mình

**Hook** — `renderHook` + wrapper QueryClientProvider, mock MODULE api (không cần network);
assert đặc trưng của optimistic: cache đổi NGAY trước khi server trả lời:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTaskStatus, type Task } from '../schema/schema';
import { useTasks } from './useTasks';

const TASKS: Task[] = [
  { id: 1, title: 'Viết test', status: 'todo', assignee: null, createdAt: '2026-01-10T08:00:00.000Z' },
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
```

**UI** — RTL với props CỨNG, không mock data layer (props là hợp đồng duy nhất cần assert):

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_STATUS_LABEL, type Task } from '../schema/schema';
import { TasksPage } from './TasksPage';

const FIXED_TASKS: Task[] = [
  { id: 1, title: 'Đọc AGENTS.md', status: 'done', assignee: 'alice', createdAt: '2026-01-10T08:00:00.000Z' },
];

describe('TasksPage', () => {
  it('render bảng với props cứng: tiêu đề + nhãn trạng thái + nút xoá', () => {
    render(<TasksPage tasks={FIXED_TASKS} onToggle={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Đọc AGENTS.md')).toBeInTheDocument();
    expect(screen.getByText(TASK_STATUS_LABEL.done)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xoá task Đọc AGENTS.md' })).toBeInTheDocument();
  });

  it('error → Alert thay bảng', () => {
    render(<TasksPage tasks={[]} error="Mạng gãy" onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Không tải được danh sách task')).toBeInTheDocument();
    expect(screen.queryByText('Đọc AGENTS.md')).not.toBeInTheDocument();
  });
});
```

**API** — tầng DUY NHẤT cần network-mock: msw node dùng LẠI `handlers` của app + assert zod parse
ở ranh giới api:

```ts
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { z } from 'zod';
import { handlers } from '@/mocks/handlers';
import { tasksApi } from './tasks-api';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('tasksApi', () => {
  it('list → msw handler trả seed + zod parse thành Task[]', async () => {
    const tasks = await tasksApi.list();
    expect(tasks.length).toBeGreaterThanOrEqual(2);
    expect(typeof tasks[0].id).toBe('number');
  });

  it('response SAI shape → zod chặn ở ranh giới api (không lan vào UI)', async () => {
    server.use(
      http.get('*/tasks', () => HttpResponse.json([{ id: 'khong-phai-so', title: 42 }])),
    );
    await expect(tasksApi.list()).rejects.toBeInstanceOf(z.ZodError);
  });

  it('lỗi server → ApiError với message từ envelope', async () => {
    server.use(http.get('*/tasks', () => HttpResponse.json({ message: 'CSDL cháy.' }, { status: 500 })));
    await expect(tasksApi.list()).rejects.toThrow('CSDL cháy.');
  });
});
```

Ghi chú: wire feature mới theo thứ tự — (1) copy 6 lớp đổi `tasks` → `<tên>`, sửa `schema.ts`
TRƯỚC; (2) thêm db + handlers vào `mocks/`, key factory trong api file; (3) trang
`routes/<tên>.tsx` import qua index + khai báo `Route`/`NavLink` trong `app/router.tsx`; (4) 3
test cạnh file. Chốt mỗi feature: `pnpm lint && pnpm typecheck && pnpm test`. `apiFetch` + error
envelope chung nằm ở `@/shared/api/client` (lỗi server ném `ApiError` với `message` từ envelope);
nối backend thật = đặt env `VITE_API_URL` — MSW tự nhường chỗ, handlers giữ nguyên làm test.
Ma trận import đầy đủ xem `AGENTS.md` trong scaffold.

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
