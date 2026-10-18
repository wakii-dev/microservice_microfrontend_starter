# AI Recipes — 10 công thức UI dùng `@wakii/ui-kit`

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
