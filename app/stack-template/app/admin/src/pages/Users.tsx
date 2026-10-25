// Users — DataTable + Select filter trạng thái + Pagination + Modal CRUD
// (useForm ui-kit + zod: tên/email bắt buộc, role Select, avatar Upload,
// message thành công/thất bại — email fail@demo.local cố ý fail, batch ⑦).
import { useMemo, useState } from 'react';
import { z } from 'zod';
import {
  Avatar,
  Badge,
  Button,
  Field,
  Icon,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
  Upload,
  message,
  useForm,
} from '@wakii/ui-kit';
import {
  MOCK_USERS,
  ROLE_OPTIONS,
  STATUS_BADGE,
  STATUS_OPTIONS,
  type AdminUser,
  type UserStatus,
  type UserRole,
} from '../data/users.js';

const PAGE_SIZE = 5;

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

/** Modal CRUD — key theo editing.id để remount form với initialValues mới. */
function UserModal({
  editing,
  onClose,
  onSubmitUser,
}: {
  editing: AdminUser | null;
  onClose: () => void;
  onSubmitUser: (values: UserFormValues) => void;
}) {
  const form = useForm<UserFormValues>({
    schema: userSchema,
    initialValues: { name: editing?.name ?? '', email: editing?.email ?? '', role: editing?.role ?? 'Viewer' },
  });
  const [avatarFile, setAvatarFile] = useState('');

  return (
    <Modal
      open
      title={editing ? `Sửa user — ${editing.name}` : 'Thêm user'}
      okText="Lưu"
      cancelText="Huỷ"
      onOk={() => form.handleSubmit(onSubmitUser)()}
      onCancel={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmitUser)} noValidate>
        <Field label="Tên" htmlFor="u-name" required error={form.errors.name}>
          <Input
            id="u-name"
            name="name"
            value={form.values.name}
            onChange={form.handleChange('name')}
            onBlur={form.handleBlur('name')}
            invalid={!!form.errors.name}
            aria-invalid={!!form.errors.name}
            aria-describedby={form.errors.name ? 'u-name-error' : undefined}
            placeholder="Nguyen Van A"
          />
        </Field>
        <Field label="Email" htmlFor="u-email" required error={form.errors.email}>
          <Input
            id="u-email"
            name="email"
            type="email"
            value={form.values.email}
            onChange={form.handleChange('email')}
            onBlur={form.handleBlur('email')}
            invalid={!!form.errors.email}
            aria-invalid={!!form.errors.email}
            aria-describedby={form.errors.email ? 'u-email-error' : undefined}
            placeholder="ten@congty.vn"
          />
        </Field>
        <Field label="Vai trò" htmlFor="u-role" hint="Quyền truy cập hệ thống">
          {/* Select trả string — bind qua setValue (handleChange đọc e.target.value không khớp) */}
          <Select
            ariaLabel="Vai trò"
            options={ROLE_OPTIONS}
            value={form.values.role}
            onChange={(value) => form.setValue('role', value as UserRole)}
          />
        </Field>
        <Field label="Avatar" htmlFor="u-avatar" hint="Tuỳ chọn — ảnh đại diện">
          <div id="u-avatar">
            <Upload accept="image/*" onChange={(files) => setAvatarFile(files[0]?.name ?? '')} />
          </div>
          {avatarFile && <p className="m-0 mt-1 text-meta text-st-done">Đã chọn: {avatarFile}</p>}
        </Field>
      </form>
    </Modal>
  );
}

export function Users() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; editing: AdminUser | null }>({ open: false, editing: null });

  const filtered = useMemo(
    () => (statusFilter ? users.filter((u) => u.status === statusFilter) : users),
    [users, statusFilter],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSubmitUser = (values: UserFormValues) => {
    // Luồng THẤT BẠI cố ý — mirror demo saga fail@demo.local của boilerplate
    if (values.email === 'fail@demo.local') {
      message.error('Thao tác thất bại — thử email khác (demo saga fail)');
      return;
    }
    if (modal.editing) {
      setUsers((prev) => prev.map((u) => (u.id === modal.editing!.id ? { ...u, ...values } : u)));
      message.success(`Đã cập nhật ${values.name}`);
    } else {
      setUsers((prev) => [{ id: `u-${Date.now()}`, ...values, status: 'invited' }, ...prev]);
      message.success(`Đã tạo ${values.name}`);
    }
    setModal({ open: false, editing: null });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-h1 font-semibold text-ink">Users</h1>
        <div className="flex items-center gap-3">
          <Select
            ariaLabel="Lọc theo trạng thái"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as string);
              setPage(1);
            }}
            className="w-44"
          />
          <Button type="primary" icon={<Icon name="plus" size={12} />} onClick={() => setModal({ open: true, editing: null })}>
            Thêm user
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-s2">
        <Table<AdminUser>
          columns={[
            {
              key: 'name',
              title: 'Người dùng',
              render: (u) => (
                <span className="flex items-center gap-2">
                  <Avatar size={26}>
                    {u.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </Avatar>
                  <span className="font-medium">{u.name}</span>
                </span>
              ),
            },
            { key: 'email', title: 'Email' },
            { key: 'role', title: 'Vai trò', render: (u) => <Tag>{u.role}</Tag> },
            {
              key: 'status',
              title: 'Trạng thái',
              render: (u) => {
                const badge = STATUS_BADGE[u.status as UserStatus];
                return <Badge variant={badge.variant}>{badge.label}</Badge>;
              },
            },
            {
              key: 'actions',
              title: '',
              render: (u) => (
                <span className="flex gap-1">
                  <Button
                    type="text"
                    size="small"
                    aria-label={`Sửa ${u.name}`}
                    icon={<Icon name="pencil" size={12} />}
                    onClick={() => setModal({ open: true, editing: u })}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    aria-label={`Xoá ${u.name}`}
                    icon={<Icon name="trash" size={12} />}
                    onClick={() => {
                      setUsers((prev) => prev.filter((x) => x.id !== u.id));
                      message.success(`Đã xoá ${u.name}`);
                    }}
                  />
                </span>
              ),
            },
          ]}
          dataSource={paged}
          rowKey="id"
        />
      </div>

      <div className="flex justify-end">
        <Pagination current={safePage} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
      </div>

      {modal.open && (
        <UserModal
          key={modal.editing?.id ?? 'new'}
          editing={modal.editing}
          onClose={() => setModal({ open: false, editing: null })}
          onSubmitUser={handleSubmitUser}
        />
      )}
    </div>
  );
}
