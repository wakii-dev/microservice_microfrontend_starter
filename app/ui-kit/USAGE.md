# USAGE — @wakii/ui-kit

Storybook :6006 = docs sống (mọi props/states demo thật). File này gồm 2 phần:
**Bắt đầu nhanh** (install/theme/form/icon/subpath/z-index) và **Tham chiếu theo component**.
Đổi behavior gần đây xem [CHANGELOG.md](./CHANGELOG.md) + [MIGRATION.md](./MIGRATION.md);
đối chiếu benchmark xem [docs/parity-matrix.md](../docs/parity-matrix.md).

---

## Bắt đầu nhanh

### Install

ui-kit là **workspace package consumed qua source** (ADR-0009) — không build, không publish:

```bash
# trong workspace monorepo
pnpm add @wakii/ui-kit --workspace   # hoặc "dependencies": { "@wakii/ui-kit": "workspace:*" }
```

Tương lai publish npm: cùng API, thay scope thật — source-consumption giúp KHÔNG phải
đợi build để tiêu thụ.

**Peer-dep**: `zod ^4` (useForm) · `swiper` (subpath carousel) · `chart.js` (chart) ·
`@fullcalendar/*` (schedule — optional, có fallback) · `@tiptap/*` (editor).

### Dark theme

Dark là theme phụ — bật bằng attribute `data-bp-theme="dark"` ở node bao ngoài
(CSS var cascade xuống subtree, không đụng `:root` light):

```tsx
<html data-bp-theme="dark">  {/* cả app */}
// hoặc subtree:
<div data-bp-theme="dark" className="bg-canvas p-4">…</div>
```

Không tự chế token mới — thiếu token flag coordinator (`tokens.css` là source of truth;
dark chỉ override dưới `[data-bp-theme='dark']` trong `themes/dark.css`).

### Form — useForm + Field + zod

Schema là source of truth; `useForm` trả `values/errors/touched` + handlers:

```tsx
import { z } from 'zod';
import { useForm, Field, Input, Button } from '@wakii/ui-kit';

const schema = z.object({
  email: z.string().min(1, 'Email bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
});

function LoginForm() {
  const form = useForm({ schema, initialValues: { email: '', password: '' }, mode: 'onSubmit' });
  return (
    <form onSubmit={form.handleSubmit((data) => login(data))}>
      <Field label="Email" htmlFor="email" error={form.errors.email} required>
        <Input id="email" name="email" value={form.values.email} invalid={!!form.errors.email}
          onChange={form.handleChange('email')} onBlur={form.handleBlur('email')} />
      </Field>
      <Field label="Mật khẩu" htmlFor="password" error={form.errors.password} required>
        <Input id="password" name="password" type="password" value={form.values.password}
          invalid={!!form.errors.password} onChange={form.handleChange('password')} />
      </Field>
      {/* sai → focus tự rơi vào field đầu (`[name=…]`); đúng → handleSubmit nhận data ĐÃ transform */}
      <Button htmlType="submit">Đăng nhập</Button>
    </form>
  );
}
```

`mode`: `onSubmit` (mặc định) · `onBlur` (validate khi rời input) · `onChange` (validate
khi gõ, lỗi tự xoá khi sửa đúng). `reset()` xoá values/errors/touched về initial.

### Icon

48 icon path data gốc primeicons; `fill=currentColor` nên kế thừa màu text cha:

```tsx
import { Icon } from '@wakii/ui-kit';

<Icon name="chevron-right" />          // default 14px
<Icon name="settings" size={20} className="text-accent" />
<Icon name="search" aria-hidden={false} /> // icon có nghĩa, cho screen reader
```

Danh sách `IconName` hợp lệ (union — gõ sai compile lỗi ngay):

`chevron-up · chevron-down · chevron-left · chevron-right · angle-double-left · angle-double-right · search · plus · minus · times · check · check-circle · info-circle · exclamation-triangle · upload · download · calendar · clock · user · users · home · settings · menu-bars · ellipsis-h · ellipsis-v · pencil · trash · eye · eye-slash · refresh · filter · sort · sort-up · sort-down · arrow-up · arrow-down · arrow-left · arrow-right · caret-up · caret-down · caret-left · caret-right · star · heart · bell · external-link · copy · help-circle`

Runtime nhận name lạ (bypass type) → render fallback `help-circle`. Xem tất cả ở
Storybook **Primitives/Icons → AllIcons**.

### Component nặng — subpath

Barrel chính KHÔNG kéo CSS của comp nặng. Import qua subpath tương ứng:

```tsx
import { Carousel } from '@wakii/ui-kit/carousel';   // kèm swiper CSS; swiper là peer-dep
import { Chart } from '@wakii/ui-kit/chart';         // chart.js
import { Schedule } from '@wakii/ui-kit/schedule';   // @fullcalendar/* optional, có fallback
import { Editor } from '@wakii/ui-kit/editor';       // @tiptap/*
```

### Z-index tier

Thứ tự tầng cố định — component trong kit đã dùng token, consumer overlay tự viết
đừng hardcode số:

| Tier | Token | Giá trị | Dùng cho |
|---|---|---|---|
| 1 | `--z-dropdown` | 1000 | menu, select panel, context menu |
| 2 | `--z-popover` | 1030 | popover |
| 3 | `--z-modal` | 1050 | modal, drawer, image preview |
| 4 | `--z-toast` | 1070 | message/notification toast |
| 5 | `--z-tooltip` | 1090 | tooltip trên cùng |

```tsx
<div className="fixed inset-0 z-[var(--z-modal)]">…</div>
```

### Customize pass (SÓNG-3) — `classNames` slots

Từ customize pass, các component chính đều nhận prop `classNames` kiểu antd v5:
một object các **slot**, mỗi slot dán class vào đúng một phần tử trong DOM của
component. Ba nguyên tắc:

1. **Default path bất biến** — không truyền `classNames` → DOM và class y hệt như
   trước đó, không sinh thêm node (slot chỉ render khi cần).
2. **Slot merge sau class mặc định** — class bạn truyền qua slot chèn sau phần
   structural; `className` prop vẫn luôn merge sau cùng (pattern antd).
3. **`style` passthrough** — các comp đơn-phần-tử (Tag, Input, Popover, Tooltip,
   Progress…) nhận thêm `style` thẳng lên element gốc.

Bảng slots theo đúng type `*ClassNames` export từ source (29 interface):

| Component | Slots | Ghi chú |
|---|---|---|
| Alert | wrapper · icon · message · description · closeButton | |
| Button | root · icon | slot `icon` chỉ render khi truyền |
| Card | root · header · title · extra · body · actions | |
| Checkbox | root · box · label | |
| Descriptions | root · title · item · label · content | |
| Drawer | wrapper · mask · header · body · footer | panel = `wrapper`, overlay = `mask` |
| EmptyState | root · image · title · description · action | |
| Input | root · input · prefix · suffix | có affix: viền/ring ở `root`, `<input>` trần ở `input` |
| Textarea | root · textarea · count | |
| List | root · header · item · footer | |
| Modal | wrapper · mask · header · body · footer · closeButton | panel = `wrapper`, overlay = `mask` |
| Popover | root · trigger · panel | `panel` = phần tử `role="dialog"` |
| Progress | root · track · bar · info | |
| Radio | root · box · label | |
| RadioGroup | root | |
| Select | root · trigger · panel · listbox · option | |
| Skeleton | wrapper · bone | |
| Spinner | root · indicator | |
| Statistic | root · title · value · prefix · suffix | |
| Steps | root · step · indicator · label · description | |
| Switch | root · handle | |
| Tabs | wrapper · tablist · tab · panel | |
| Tag | root | comp 1 phần tử chính |
| Tag.Checkable | root | chip `<button aria-pressed>` |
| Timeline | root · item · dot · label | |
| Timesheet | wrapper · header · row · cell · footer | |
| Tooltip | trigger · bubble | |

Ba ví dụ copy-paste chạy được:

```tsx
// ① Button — pill + nhãn nhỏ hơn, không đụng variant
<Button type="primary" classNames={{ root: 'rounded-pill px-5', icon: 'opacity-80' }}>
  Deploy
</Button>

// ② Input — viền đậm, góc vuông hơn (affix mode: viền/ring nằm ở slot `root`)
<Input
  prefix={<Icon name="search" size={16} />}
  classNames={{ root: 'border-2 rounded-xl shadow-none', prefix: 'text-ink2' }}
  placeholder="Tìm task…"
/>

// ③ Tag — 1 phần tử chính nên chỉ có slot `root`
<Tag classNames={{ root: 'rounded-pill tracking-wider uppercase' }}>beta</Tag>
```

Lưu ý kỹ thuật khi override:

- Merge dùng package `classnames` — **không phải tailwind-merge**: hai utility
  CÙNG NHÓM (vd `text-ink` mặc định và `text-accent` của bạn) không phân thắng
  bại theo thứ tự truyền mà theo **thứ tự rule trong CSS sinh ra**. Không nên
  giả định class truyền sau sẽ đè class trước.
- Muốn đè chắc một nhóm trùng, thêm modifier important của Tailwind v4 — hậu tố
  `!` (vd `text-accent!`, `rounded-xl!`), hoặc né xung đột bằng cách đổi nhóm
  khác (spacing/radius thường an toàn hơn màu).
- Ưu tiên override qua **slot đúng phần tử** thay vì nhét hết vào `className` —
  slot tới đúng đích (vd viền Input ở `root`, chữ placeholder phải qua `input`),
  className thì chỉ dính một element.

Hạn chế đã biết (ghi nhận, chưa xử lý): 8 type chưa re-export qua barrel
(`AlertClassNames`, `DrawerClassNames`, `MessageClassNames`, `ModalClassNames`,
`NotificationClassNames`, `RadioClassNames`, `SkeletonClassNames`,
`TabsClassNames` — hiện chỉ có ở module component); `MessageClassNames` /
`NotificationClassNames` có interface nhưng props chưa nhận `classNames`.

---

## Tham chiếu theo component

### Import

```tsx
// UI primitives
import { Badge, EmptyState, Skeleton, Spinner, Button, Input, Textarea, Tag,
  Alert, Modal, Popconfirm, Select, Tooltip, Card, Statistic, Pagination,
  Checkbox, Radio, RadioGroup, Switch, InputNumber, Tabs, Dropdown, Segmented,
  Avatar, Drawer, Progress, Result, Descriptions, Collapse, UiImage, Table,
  Breadcrumb, Steps, BusyBox, Typography, Divider, Space,
  UiKitProvider, message, notification } from '@wakii/ui-kit';

// Styles (shell import global; remote standalone tự import)
import '@wakii/ui-kit/styles/tokens.css';
import '@wakii/ui-kit/styles/base.css';
import '@wakii/ui-kit/styles/tailwind.css'; // shell làm chủ; remote import trong app.css
```

### Badge

```tsx
<Badge variant="doing">Đang làm</Badge>
// variant: todo|doing|done|failed + created|updated|assigned|deleted|assignmentFailed
```

### EmptyState

```tsx
<EmptyState title="Chưa có task nào" description="Tạo task đầu tiên."
  action={<Button>Tạo</Button>} image={<img src="…" />} />
```

### Skeleton

```tsx
<Skeleton variant="row" count={4} className="custom" />
// variant: text|row|card
```

### Spinner

```tsx
<Spinner label="Đang xử lý" variant="dots" size="large" color="muted" />
// variant: ring|dots|bars · size: small|default|large · color: accent|muted|inverse
```

### BusyBox

```tsx
<BusyBox busy={loading} variant="row" count={4}>
  <TaskList items={items} />
</BusyBox>
// busy=true → Skeleton thay content (aria-busy); busy=false → content
```

### Button

```tsx
<Button type="primary" htmlType="submit" loading={saving} block>Tạo task</Button>
<Button type="text" danger icon={<span>🗑</span>}>Xoá</Button>
// type: primary|default|text · danger · size: small|middle|large · loading · block · icon
```

### Input / Textarea

```tsx
<Input value={v} onChange={e => setV(e.target.value)} placeholder="Nhập…"
  prefix="🔍" allowClear invalid size="large" />
<Textarea rows={3} maxLength={200} showCount value={d} onChange={setD} invalid />
// prefix/suffix kích hoạt affix wrapper · allowClear cần controlled (value+onChange)
```

### Select

```tsx
<Select ariaLabel="Trạng thái" value={status} onChange={setStatus}
  options={[{label:'Cần làm', value:'todo'}, …]}
  placeholder="Chọn…" disabled />
// a11y: combobox + listbox + keyboard (Enter/Space/Arrow/Esc)
```

### Checkbox / Radio / Switch / InputNumber

```tsx
<Checkbox checked={remember} onChange={setRemember}>Nhớ tôi</Checkbox>
<RadioGroup value={sort} onChange={setSort} options={[{label:'Mới', value:'new'}]} />
<Switch checked={on} onChange={setOn} checkedChildren="Bật" unCheckedChildren="Tắt" />
<InputNumber value={n} onChange={setN} min={0} max={100} step={1} ariaLabel="Số" />
```

### Alert

```tsx
<Alert type="error" message="Lỗi" description="Chi tiết" closable onClose={fn} />
// type: success|info|warning|error · mặc định filled (nền đặc, chữ trắng);
// variant="outlined" giữ look tint + viền cũ
```

### Modal

```tsx
<Modal open={open} title="Xoá?" danger okText="Xác nhận xoá"
  confirmLoading={busy} onOk={handleDelete} onCancel={() => setOpen(false)}>
  Hành động không thể hoàn tác.
</Modal>
// ESC + overlay click = cancel; zoom-in/out motion
```

### Drawer

```tsx
<Drawer open={open} title="Chi tiết" width={378} onClose={close}
  footer={<Button>Lưu</Button>}>
  Nội dung
</Drawer>
// slide-in/slide-out motion
```

### Popconfirm

```tsx
<Popconfirm open={open} title="Xoá?" danger okText="Xoá"
  onConfirm={del} onCancel={close}>
  <Button danger>Xoá</Button>
</Popconfirm>
```

### message / notification (static API)

```tsx
import { message, notification } from '@wakii/ui-kit';
message.success('Đã xoá'); message.error('Lỗi');
notification.info('Tiêu đề', 'Mô tả chi tiết');
```

### Card

```tsx
<Card title="Tiêu đề" extra={<a>Thêm</a>} hoverable actions={[<span>Action</span>]}>
  Nội dung
</Card>
```

### Statistic

```tsx
<Statistic title="Tổng task" value={42} prefix="↑" suffix="việc" valueStyle={{color:'var(--accent)'}} />
```

### Tooltip

```tsx
<Tooltip title="Gợi ý"><Button>?</Button></Tooltip>
// placement: top (mặc định) | bottom · hover + focus
```

### Table (DataTable)

```tsx
<Table columns={[
  { key: 'title', title: 'Tiêu đề', sortable: true, filterable: true },
  { key: 'act', title: '', render: r => <Button>Xoá</Button> },
  { key: 'exp', title: '', expander: true },
]} dataSource={data} rowKey="id"
  paginator pageSize={10} rowsPerPageOptions={[5,10,20]}
  selectionMode="checkbox" onSelectionChange={setSelected}
  sortMode="multiple" onSort={setSorts}
  scrollHeight={400} striped size="small" loading={loading}
  rowExpansion={r => <Detail id={r.id} />}
  emptyMessage={<EmptyState title="Trống" />}
/>
```

Table contracts:

- Sort click: asc → desc → none (cycle); Shift/Meta click: multi-sort
- Filter: contains (mặc định) / equals / startsWith — per-column match mode
- Paginator: Pagination + Select số dòng

### Tabs

```tsx
<Tabs items={[{key:'1', label:'Tab 1', children:<Content1/>}]} onChange={setKey} />
```

### Pagination

```tsx
<Pagination current={page} pageSize={10} total={100} onChange={setPage} />
```

### Breadcrumb

```tsx
<Breadcrumb items={[{title:'Home', href:'/'}, {title:'Task A'}]} />
```

### Steps

```tsx
<Steps items={[{title:'Đặt hàng', description:'Giỏ hàng'}]} current={1} />
```

### Dropdown

```tsx
<Dropdown trigger={<Button>Menu</Button>} onItemClick={k => go(k)}
  items={[{key:'edit', label:'Sửa'}, {key:'---', label:''}, {key:'del', label:'Xoá', danger:true}]} />
```

### Segmented

```tsx
<Segmented options={[{label:'Ngày', value:'day'}]} value={view} onChange={setView} />
```

### Theming

Dark theme bật qua attribute (xem **Bắt đầu nhanh → Dark theme**):

```tsx
<div data-bp-theme="dark">…</div>
```

`UiKitProvider` vẫn cung cấp context chung cho kit (accent override qua CSS vars cascade,
không cần JS re-render).

### Motion

Xem `docs/motion.md` — motion scale, easing, guidelines. Tất cả animation tôn trọng
`prefers-reduced-motion`.

### Composition Rule

Composite components GHÉP từ primitives của chính kit — KHÔNG tay chế raw
`<select>/<input>/<button>` nội bộ.

| Composite | Dùng primitives |
|---|---|
| Table | Pagination + Select + Checkbox + Input + Button + EmptyState + Skeleton |
| Select | Button (trigger) + Checkbox (multi) + Spinner (loading) |
| Popconfirm | Button (OK/Cancel) |
| Modal/Drawer | Button (OK/Cancel/Đóng) |
| FilterMenu | Select (match mode) + Input (value) + Button (Apply/Reset) |

**Verify:** `grep -rn '<select\|<button' app/ui-kit/src/ui/*/index.tsx | grep -v primitives`
→ 0 kết quả (trừ primitives tự thân).

### Viết component mới (quy ước)

- Màu/radius/motion/z-index **chỉ dùng token** — thiếu token flag coordinator, không tự thêm (`docs/parity-matrix.md` §Nguyên tắc).
- Ngôn ngữ nút: thường `transparent + hover:bg-s3` · active `bg-accent text-white font-medium` · disabled `text-ink3/ink4` không hover.
- Icon: dùng `<Icon name="…">` — không tự vẽ SVG chevron riêng.
- A11y: `role`/`aria-expanded`/`aria-current`/`aria-label` tiếng Việt như các comp hiện có.
- Test: behavior thật colocated `*.test.tsx` (vitest + testing-library); story matrix `*.stories.tsx` **phải có ≥1 `export const`** (file 0-export bị indexer drop — bài học batch ⑮).
