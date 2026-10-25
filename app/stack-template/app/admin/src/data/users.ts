// Mock users — Users page (CRUD demo + filter + pagination). Email fail@demo.local
// cố ý để demo luồng THẤT BẠI (mirror saga demo của boilerplate).
export type UserRole = 'Admin' | 'Editor' | 'Viewer';
export type UserStatus = 'active' | 'invited' | 'disabled';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export const MOCK_USERS: AdminUser[] = [
  { id: 'u-01', name: 'Alice Nguyen', email: 'alice@demo.local', role: 'Admin', status: 'active' },
  { id: 'u-02', name: 'Bob Tran', email: 'bob@demo.local', role: 'Editor', status: 'active' },
  { id: 'u-03', name: 'Carol Le', email: 'carol@demo.local', role: 'Viewer', status: 'invited' },
  { id: 'u-04', name: 'David Pham', email: 'david@demo.local', role: 'Editor', status: 'active' },
  { id: 'u-05', name: 'Eve Vu', email: 'eve@demo.local', role: 'Viewer', status: 'disabled' },
  { id: 'u-06', name: 'Frank Hoang', email: 'frank@demo.local', role: 'Viewer', status: 'active' },
  { id: 'u-07', name: 'Grace Dang', email: 'grace@demo.local', role: 'Editor', status: 'invited' },
  { id: 'u-08', name: 'Heidi Bui', email: 'heidi@demo.local', role: 'Admin', status: 'active' },
  { id: 'u-09', name: 'Ivan Do', email: 'ivan@demo.local', role: 'Viewer', status: 'disabled' },
  { id: 'u-10', name: 'Judy Ngo', email: 'judy@demo.local', role: 'Editor', status: 'active' },
  { id: 'u-11', name: 'Mallory Ly', email: 'mallory@demo.local', role: 'Viewer', status: 'invited' },
  { id: 'u-12', name: 'Oscar Trinh', email: 'oscar@demo.local', role: 'Viewer', status: 'active' },
];

export const STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Hoạt động', value: 'active' },
  { label: 'Đang mời', value: 'invited' },
  { label: 'Đã khoá', value: 'disabled' },
];

export const ROLE_OPTIONS = [
  { label: 'Admin', value: 'Admin' },
  { label: 'Editor', value: 'Editor' },
  { label: 'Viewer', value: 'Viewer' },
];

/** Trạng thái → variant Badge (map task-status tokens: done xanh / doing vàng / todo xám). */
export const STATUS_BADGE = {
  active: { variant: 'done', label: 'Hoạt động' },
  invited: { variant: 'doing', label: 'Đang mời' },
  disabled: { variant: 'todo', label: 'Đã khoá' },
} as const;
