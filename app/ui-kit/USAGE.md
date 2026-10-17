# USAGE — @wakii/ui-kit

Hướng dẫn sử dụng từng component. Storybook :6006 = docs sống (mọi props/states demo thật).

## Import

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

## Primitives

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

## Forms

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

## Feedback

### Alert
```tsx
<Alert type="error" message="Lỗi" description="Chi tiết" closable onClose={fn} />
// type: success|info|warning|error
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

## Data Display

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

### Table contracts
- Sort click: asc → desc → none (cycle); Shift/Meta click: multi-sort
- Filter: contains (mặc định) / equals / startsWith — per-column match mode
- Paginator: Pagination + Select số dòng

## Navigation

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

## Theming

```tsx
<UiKitProvider theme="dark" accent="#e11d48">
  <App />
</UiKitProvider>
// theme: light (mặc định — antd look) | dark (direction B archive)
// accent: override brand — CSS vars cascade, không cần JS re-render
```

## Motion

Xem `docs/motion.md` — motion scale, easing, guidelines. Tất cả animation tôn trọng `prefers-reduced-motion`.


## Composition Rule

Composite components GHÉP từ primitives của chính kit — KHÔNG tay chế raw `<select>/<input>/<button>` nội bộ.

| Composite | Dùng primitives |
|---|---|
| Table | Pagination + Select + Checkbox + Input + Button + EmptyState + Skeleton |
| Select | Button (trigger) + Checkbox (multi) + Spinner (loading) |
| Popconfirm | Button (OK/Cancel) |
| Modal/Drawer | Button (OK/Cancel/Đóng) |
| FilterMenu | Select (match mode) + Input (value) + Button (Apply/Reset) |

**Verify:** `grep -rn '<select\|<button' app/ui-kit/src/ui/*/index.tsx | grep -v primitives` → 0 kết quả (trừ primitives tự thân).
