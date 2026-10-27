// Users — CRUD showcase theo Templates/CRUD Table (templates-crud-table--full-demo):
// toolbar Input.Search + 2 Select filter + Segmented view (bảng/thẻ) + Create +
// batch delete khi chọn · Table sort 3-state + selection + expandable + fixed header
// + summary + Pagination · Drawer CREATE khác EDIT (edit có nested Descriptions +
// Timeline audit) · useForm + zod · Popconfirm xoá (row + batch) · message toasts ·
// loading skeleton / error Alert demo toggle. Email fail@demo.local cố ý fail
// (mirror saga demo của boilerplate).
// Customize pass: Card/Statistic classNames slots (dogfood slots-wave; Button slots
// skip — kit leak prop qua rest).
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Field,
  Flex,
  Icon,
  Input,
  Popconfirm,
  Progress,
  Row,
  Segmented,
  Select,
  Statistic,
  Switch,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Upload,
  message,
  useForm,
  type TableColumn,
} from '@wakii/ui-kit';
import {
  MOCK_USERS,
  ROLE_FILTER_OPTIONS,
  ROLE_OPTIONS,
  STATUS_BADGE,
  STATUS_OPTIONS,
  type AdminUser,
  type UserRole,
} from '../data/users.js';

interface UserFormValues {
  name: string;
  email: string;
  role: UserRole;
}

const userSchema = z.object({
  name: z.string().min(1, 'Tên bắt buộc'),
  email: z.email('Email không hợp lệ'),
  role: z.enum(['Admin', 'Editor', 'Viewer']),
});

// ── Drawer form (useForm + zod) — remount theo user để initialValues luôn đúng ──
function UserForm({ initial, onSubmit, onCancel }: {
  initial: AdminUser | null;
  onSubmit: (v: UserFormValues) => void;
  onCancel: () => void;
}) {
  const form = useForm<UserFormValues>({
    schema: userSchema,
    mode: 'onChange',
    initialValues: { name: initial?.name ?? '', email: initial?.email ?? '', role: initial?.role ?? 'Viewer' },
  });
  const [avatarFile, setAvatarFile] = useState('');

  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="flex items-center gap-2">
        <Avatar size={32}>{(initial?.name ?? 'n').charAt(0).toUpperCase()}</Avatar>
        <span className="text-label text-ink3">
          {initial ? `Email đăng nhập: ${initial.email}` : 'User mới — mặc định ở trạng thái Đang mời'}
        </span>
      </div>
      <Field label="Tên" htmlFor="u-name" required error={form.errors.name}>
        <Input
          id="u-name"
          name="name"
          placeholder="Nguyen Van A"
          value={form.values.name}
          invalid={!!form.errors.name}
          onChange={form.handleChange('name')}
          onBlur={form.handleBlur('name')}
        />
      </Field>
      <Field label="Email" htmlFor="u-email" required error={form.errors.email}>
        <Input
          id="u-email"
          name="email"
          type="email"
          placeholder="ten@congty.vn"
          value={form.values.email}
          invalid={!!form.errors.email}
          onChange={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
        />
      </Field>
      <Field label="Vai trò" htmlFor="u-role" hint="Quyền truy cập hệ thống">
        {/* Select trả string — bind qua setValue (handleChange đọc e.target.value không khớp) */}
        <div id="u-role">
          <Select
            ariaLabel="Vai trò"
            options={ROLE_OPTIONS}
            value={form.values.role}
            onChange={(value) => form.setValue('role', value as UserRole)}
          />
        </div>
      </Field>
      <Field label="Avatar" htmlFor="u-avatar" hint="Tuỳ chọn — ảnh đại diện">
        <div id="u-avatar">
          <Upload accept="image/*" onChange={(files) => setAvatarFile(files[0]?.name ?? '')} />
        </div>
        {avatarFile && <p className="m-0 mt-1 text-meta text-st-done">Đã chọn: {avatarFile}</p>}
      </Field>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="default" onClick={onCancel}>Huỷ</Button>
        <Button htmlType="submit" type="primary">
          {initial ? 'Lưu thay đổi' : 'Tạo user'}
        </Button>
      </div>
    </form>
  );
}

// ── Nested detail (chỉ Drawer EDIT): Descriptions + Timeline audit ──
function UserDetailSection({ user }: { user: AdminUser }) {
  const badge = STATUS_BADGE[user.status];
  return (
    <div className="mt-6 border-t border-line2 pt-4">
      <span className="text-body font-semibold text-ink">Chi tiết &amp; nhật ký</span>
      <Descriptions
        className="mt-3"
        items={[
          { label: 'Trạng thái', children: <Badge variant={badge.variant}>{badge.label}</Badge> },
          { label: 'Hoạt động cuối', children: <span className="text-body">{user.lastActive}</span> },
          { label: 'Vai trò', children: <Tag>{user.role}</Tag> },
        ]}
      />
      <Timeline
        className="mt-4"
        items={[
          { key: 'l1', children: 'Tài khoản được tạo', label: '2 tuần trước' },
          { key: 'l2', color: 'var(--st-doing)', children: `Đổi vai trò thành ${user.role}`, label: '1 tuần trước' },
          { key: 'l3', children: `Hoạt động cuối — ${user.lastActive}`, label: 'mới nhất' },
        ]}
      />
    </div>
  );
}

export function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [view, setView] = useState('table');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load mock — latency ngắn để skeleton Table chạy thật; toggle Error demo Alert.
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsers(MOCK_USERS);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (!statusFilter || u.status === statusFilter) &&
          (!roleFilter || u.role === roleFilter) &&
          (u.name.toLowerCase().includes(q.trim().toLowerCase()) ||
            u.email.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [users, q, statusFilter, roleFilter],
  );
  const activePct = users.length ? Math.round((users.filter((u) => u.status === 'active').length / users.length) * 100) : 0;

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(u: AdminUser) {
    setEditing(u);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  function submitUser(values: UserFormValues) {
    // Luồng THẤT BẠI cố ý — mirror demo saga fail@demo.local của boilerplate
    if (values.email === 'fail@demo.local') {
      message.error('Thao tác thất bại — thử email khác (demo saga fail)');
      return;
    }
    if (editing) {
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...values } : u)));
      message.success(`Đã cập nhật ${values.name}`);
    } else {
      setUsers((prev) => [
        { id: `u-${Date.now()}`, ...values, status: 'invited', lastActive: 'chưa vào lần nào' },
        ...prev,
      ]);
      message.success(`Đã tạo ${values.name}`);
    }
    closeDrawer();
  }

  function removeUser(u: AdminUser) {
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    setSelectedKeys((prev) => prev.filter((k) => k !== u.id));
    message.success(`Đã xoá ${u.name}`);
  }

  const columns: TableColumn<AdminUser>[] = [
    { key: 'name', title: 'Người dùng', sortable: true,
      render: (u) => (
        <span className="flex items-center gap-2">
          <Avatar size={26}>
            {u.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
          </Avatar>
          <span className="font-medium">{u.name}</span>
        </span>
      ) },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'role', title: 'Vai trò', render: (u) => <Tag>{u.role}</Tag> },
    {
      key: 'status',
      title: 'Trạng thái',
      sortable: true,
      render: (u) => {
        const badge = STATUS_BADGE[u.status];
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: 'actions',
      title: '',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Button type="text" size="small" aria-label={`Sửa ${u.name}`} onClick={() => openEdit(u)}>
            Sửa
          </Button>
          <Tooltip title={`Xoá ${u.name}`}>
            <Popconfirm
              open={deletingId === u.id}
              title={`Xoá "${u.name}"?`}
              description="Hành động không thể hoàn tác."
              okText="Xoá"
              cancelText="Giữ"
              danger
              onConfirm={() => {
                removeUser(u);
                setDeletingId(null);
              }}
              onCancel={() => setDeletingId(null)}
            >
              <Button
                type="text"
                size="small"
                danger
                aria-label={`Xoá ${u.name}`}
                icon={<Icon name="trash" size={12} />}
                onClick={() => setDeletingId(u.id)}
              />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <h1 className="m-0 text-h1 font-semibold text-ink">Users</h1>
        <p className="mb-0 mt-1 text-body text-ink2">Quản lý thành viên — CRUD showcase theo Templates/CRUD Table.</p>
      </div>

      {/* Toolbar — Search + 2 filter + Segmented view + Create + batch actions + toggles */}
      <Flex gap="small" wrap className="items-center">
        <div className="w-56">
          <Input.Search aria-label="Tìm user" placeholder="Tìm theo tên hoặc email…" onSearch={setQ} />
        </div>
        <Select
          ariaLabel="Lọc theo trạng thái"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as string)}
          className="w-44"
        />
        <Select
          ariaLabel="Lọc theo vai trò"
          options={ROLE_FILTER_OPTIONS}
          value={roleFilter}
          onChange={(value) => setRoleFilter(value as string)}
          className="w-40"
        />
        <Segmented
          options={[
            { label: 'Bảng', value: 'table' },
            { label: 'Thẻ', value: 'cards' },
          ]}
          value={view}
          onChange={setView}
        />
        {/* NOTE: Button classNames slots skip — kit leak prop qua {...rest} (report ui-kit) */}
        <Button type="primary" icon={<Icon name="plus" size={12} />} onClick={openCreate}>
          Thêm user
        </Button>
        {selectedKeys.length > 0 && (
          <Popconfirm
            open
            title={`Xoá ${selectedKeys.length} user đã chọn?`}
            okText="Xoá"
            danger
            onConfirm={() => {
              setUsers((prev) => prev.filter((u) => !selectedKeys.includes(u.id)));
              message.success(`Đã xoá ${selectedKeys.length} user.`);
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

      {/* Tổng quan mini — Statistic + Progress (customize pass: Statistic classNames) */}
      <Card classNames={{ body: 'p-4' }}>
        <Flex gap="middle" className="items-center">
          <Statistic title="Tổng user" value={users.length} />
          {/* Customize pass — Statistic classNames.value slot */}
          <Statistic title="Đang hoạt động" value={users.filter((u) => u.status === 'active').length} classNames={{ value: 'text-st-done' }} />
          <div className="min-w-0 flex-1">
            <Progress percent={activePct} />
            <p className="mb-0 mt-1 text-meta text-ink3">{activePct}% user ở trạng thái Hoạt động.</p>
          </div>
        </Flex>
      </Card>

      {/* ERROR state — banner + retry (demo toggle). Alert không có prop action →
          nút retry đứng cạnh banner trong cùng Flex. */}
      {apiError && (
        <Flex gap="middle" className="items-center">
          <Alert
            type="error"
            message="Không tải được danh sách user"
            description="GET /api/users trả 503 — demo error envelope của kit (convention 04)."
          />
          <Button size="small" onClick={() => setApiError(false)}>Thử lại</Button>
        </Flex>
      )}

      {/* Data area — bảng hoặc thẻ theo Segmented view */}
      {view === 'table' ? (
        <Table<AdminUser>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          striped
          scroll={{ y: 340 }}
          loading={loading}
          selectionMode="checkbox"
          selectedRowKeys={selectedKeys}
          onSelectionChange={(rows) => setSelectedKeys(rows.map((r) => String((r as AdminUser).id)))}
          expandable={{
            expandedRowRender: (u) => (
              <p className="m-0 text-label text-ink2">
                {u.email} · {u.role} · Hoạt động cuối: {u.lastActive}
              </p>
            ),
          }}
          paginator
          pageSize={8}
          emptyMessage={<p className="p-6 text-body text-ink2">Không có user khớp bộ lọc — xoá từ khoá thử xem.</p>}
          summary={(page) => (
            <div className="flex items-center justify-between text-label text-ink2">
              <span>{page.length} trên trang</span>
              <span className="text-ink">{page.filter((u) => u.status === 'active').length} đang hoạt động</span>
            </div>
          )}
        />
      ) : (
        <Row gutter={[12, 12]}>
          {!loading &&
            filtered.map((u) => (
              <Col key={u.id} xs={24} md={12} xl={8}>
                {/* Card không có prop onClick → bọc div role=button (a11y) */}
                <div role="button" tabIndex={0} className="cursor-pointer" onClick={() => openEdit(u)}>
                  <Card
                    title={u.name}
                    extra={<Badge variant={STATUS_BADGE[u.status].variant}>{STATUS_BADGE[u.status].label}</Badge>}
                    hoverable
                    classNames={{ root: 'h-full', body: 'p-4' }}
                  >
                    <p className="m-0 text-label text-ink3">{u.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar size={22}>{u.name.charAt(0)}</Avatar>
                      <Tag>{u.role}</Tag>
                      <span className="ml-auto text-meta text-ink3">{u.lastActive}</span>
                    </div>
                  </Card>
                </div>
              </Col>
            ))}
        </Row>
      )}

      {/* Drawer CREATE vs EDIT — edit thêm nested Descriptions + Timeline audit */}
      <Drawer
        open={drawerOpen}
        title={editing ? `Sửa user — ${editing.name}` : 'Thêm user'}
        width={440}
        onClose={closeDrawer}
      >
        <UserForm key={editing?.id ?? 'new'} initial={editing} onCancel={closeDrawer} onSubmit={submitUser} />
        {editing && <UserDetailSection user={editing} />}
      </Drawer>
    </div>
  );
}
