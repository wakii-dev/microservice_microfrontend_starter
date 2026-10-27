// Mock users — Users page (CRUD showcase theo Templates/CRUD Table + filter +
// pagination). Email fail@demo.local cố ý để demo luồng THẤT BẠI (mirror saga demo
// của boilerplate). lastActive phục vụ row mở rộng + Descriptions trong Drawer edit.
export type UserRole = 'Admin' | 'Editor' | 'Viewer';
export type UserStatus = 'active' | 'invited' | 'disabled';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
}

export const MOCK_USERS: AdminUser[] = [
  { id: 'u-01', name: 'Alice Nguyen', email: 'alice@demo.local', role: 'Admin', status: 'active', lastActive: '5 phút trước' },
  { id: 'u-02', name: 'Bob Tran', email: 'bob@demo.local', role: 'Editor', status: 'active', lastActive: '1 giờ trước' },
  { id: 'u-03', name: 'Carol Le', email: 'carol@demo.local', role: 'Viewer', status: 'invited', lastActive: 'chưa vào lần nào' },
  { id: 'u-04', name: 'David Pham', email: 'david@demo.local', role: 'Editor', status: 'active', lastActive: '3 giờ trước' },
  { id: 'u-05', name: 'Eve Vu', email: 'eve@demo.local', role: 'Viewer', status: 'disabled', lastActive: '2 tuần trước' },
  { id: 'u-06', name: 'Frank Hoang', email: 'frank@demo.local', role: 'Viewer', status: 'active', lastActive: 'hôm qua' },
  { id: 'u-07', name: 'Grace Dang', email: 'grace@demo.local', role: 'Editor', status: 'invited', lastActive: 'chưa vào lần nào' },
  { id: 'u-08', name: 'Heidi Bui', email: 'heidi@demo.local', role: 'Admin', status: 'active', lastActive: '10 phút trước' },
  { id: 'u-09', name: 'Ivan Do', email: 'ivan@demo.local', role: 'Viewer', status: 'disabled', lastActive: '1 tháng trước' },
  { id: 'u-10', name: 'Judy Ngo', email: 'judy@demo.local', role: 'Editor', status: 'active', lastActive: '2 giờ trước' },
  { id: 'u-11', name: 'Mallory Ly', email: 'mallory@demo.local', role: 'Viewer', status: 'invited', lastActive: 'chưa vào lần nào' },
  { id: 'u-12', name: 'Oscar Trinh', email: 'oscar@demo.local', role: 'Viewer', status: 'active', lastActive: '4 giờ trước' },
];

export const STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Hoạt động', value: 'active' },
  { label: 'Đang mời', value: 'invited' },
  { label: 'Đã khoá', value: 'disabled' },
];

export const ROLE_FILTER_OPTIONS = [
  { label: 'Mọi vai trò', value: '' },
  { label: 'Admin', value: 'Admin' },
  { label: 'Editor', value: 'Editor' },
  { label: 'Viewer', value: 'Viewer' },
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
