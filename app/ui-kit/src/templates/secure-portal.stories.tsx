// Templates/Secure Portal — portal nội bộ dữ liệu nhạy cảm (R11 TEMPLATE-MAX):
// Watermark tên-user chạy nền TOÀN TRANG (đổi tên → tile re-bake live) + dashboard
// Table dữ liệu nhạy cảm (mask khi READ-ONLY) + Popconfirm đỏ xoá + Audit Log
// Timeline LIVE (mọi hành động ghi dòng) + Badge quyền hạn + Switch chỉ-đọc
// (readonly chặn hành động + message.warning) + EMPTY/SKELETON/ERROR 3 state.
// REF-SPEC: chrome label 11px/700 uppercase tracking 2.64px; content Orca-flavored
// (access records/tokens/audit) — không copy copy/ảnh của ref nào.
import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
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
  Watermark,
  message,
} from '../index';

const meta = {
  title: 'Templates/Secure Portal',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

interface AccessRecord {
  id: string;
  person: string;
  system: string;
  clearance: 'admin' | 'editor' | 'viewer';
  token: string;
  lastSeen: string;
  note: string;
}

const SEED: AccessRecord[] = [
  { id: 'r1', person: 'Alice Nguyễn', system: 'gateway-prod', clearance: 'admin', token: 'tok_live_9f2a', lastSeen: '2 phút trước', note: 'Rotate key hằng quý.' },
  { id: 'r2', person: 'Bob Trần', system: 'kafka-cluster', clearance: 'editor', token: 'tok_live_7c1d', lastSeen: '18 phút trước', note: 'ACL topic task-events.' },
  { id: 'r3', person: 'Carol Lê', system: 'postgres-replica', clearance: 'viewer', token: 'tok_ro_31b8', lastSeen: '1 giờ trước', note: 'Read-only replica — không DHCP.' },
  { id: 'r4', person: 'Dave Phạm', system: 'storybook-static', clearance: 'viewer', token: 'tok_ro_e04a', lastSeen: '3 giờ trước', note: 'Token hết hạn 30/11.' },
];

const CLEARANCE_BADGE: Record<AccessRecord['clearance'], { variant: 'failed' | 'doing' | 'done'; label: string }> = {
  admin: { variant: 'failed', label: 'ADMIN' },
  editor: { variant: 'doing', label: 'EDITOR' },
  viewer: { variant: 'done', label: 'VIEWER' },
};

const AUDIT_TIME = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

function SecurePortalDemo() {
  const [userName, setUserName] = useState('alice.nguyen');
  const [readonly, setReadonly] = useState(false);
  const [records, setRecords] = useState<AccessRecord[]>(SEED);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [query, setQuery] = useState('');
  const [clearanceFilter, setClearanceFilter] = useState('all');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rotate, setRotate] = useState(-18);
  const [audit, setAudit] = useState([
    { key: 'a0', color: 'var(--accent)', children: 'Đăng nhập SSO — phiên 30 phút', label: AUDIT_TIME() },
  ]);

  function log(children: string, color = 'var(--accent)') {
    setAudit((prev) => [{ key: `a${Date.now()}`, color, children, label: AUDIT_TIME() }, ...prev].slice(0, 12));
  }

  function guard(action: () => void) {
    if (readonly) {
      message.warning('Chế độ CHỈ-ĐỌC — tắt switch để thao tác.');
      return;
    }
    action();
  }

  function removeRecord(r: AccessRecord) {
    setRecords((prev) => prev.filter((x) => x.id !== r.id));
    setSelectedKeys((prev) => prev.filter((k) => k !== r.id));
    log(`Xoá token ${r.token} của ${r.person} trên ${r.system}`, 'var(--st-fail)');
    message.success(`Đã thu hồi token ${r.token}.`);
  }

  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          (clearanceFilter === 'all' || r.clearance === clearanceFilter) &&
          (r.person.toLowerCase().includes(query.trim().toLowerCase()) ||
            r.system.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [records, query, clearanceFilter],
  );

  return (
    // WATERMARK tên-user chạy nền toàn trang — đổi tên user → tile re-bake live;
    // readonly bổ sung dòng READ-ONLY vào watermark (nhấn mạnh trạng thái bằng chính watermark).
    <Watermark content={[userName.toUpperCase(), readonly ? 'READ-ONLY SESSION' : 'INTERNAL — SECURE PORTAL']} gap={[160, 160]} opacity={0.55} rotate={rotate}>
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4 p-6">
        {/* Header — brand + lock + phiên + quyền hạn + góc watermark + Switch chỉ-đọc */}
        <Flex gap="middle" wrap className="items-center">
          <span className="font-mono text-[12px] font-bold uppercase tracking-[2.4px] text-white/85">
            ORCA SECURE PORTAL
          </span>
          <Icon name="eye-slash" size={12} />
          <Tag>phiên demo</Tag>
          <Badge variant="failed">ADMIN</Badge>
          <Segmented
            options={[
              { label: '-18°', value: '-18' },
              { label: '-45°', value: '-45' },
              { label: '0°', value: '0' },
            ]}
            value={String(rotate)}
            onChange={(v) => setRotate(Number(v))}
          />
          <span className="ml-auto flex items-center gap-2 text-label text-ink3">
            Chỉ-đọc
            <Switch
              checked={readonly}
              onChange={(v) => {
                setReadonly(v);
                log(v ? 'BẬT chế độ chỉ-đọc' : 'TẮT chế độ chỉ-đọc', 'var(--st-doing)');
              }}
              aria-label="Chế độ chỉ-đọc"
            />
          </span>
        </Flex>
        <Divider className="my-1" />

        {/* KPI strip — số liệu thật theo state */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Token đang cấp" value={records.length} suffix={`/ ${SEED.length}`} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Admin" value={records.filter((r) => r.clearance === 'admin').length} valueStyle={{ color: 'var(--st-fail)' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Sự kiện audit" value={audit.length} valueStyle={{ color: 'var(--accent)' }} />
            </Card>
          </Col>
        </Row>

        {/* Hồ sơ người dùng — Descriptions (dữ liệu nhạy cảm mask khi readonly) */}
        <Card title="Hồ sơ phiên">
          <Flex gap="middle" wrap className="items-center">
            <Avatar size={40}>{userName.charAt(0).toUpperCase()}</Avatar>
            <div className="w-56">
              <Field label="Tên hiển thị trên watermark" htmlFor="sp-user">
                <Input id="sp-user" value={userName} onChange={(e) => setUserName(e.target.value)} />
              </Field>
            </div>
            <div className="min-w-40 flex-1">
              <Progress percent={readonly ? 0 : 72} status={readonly ? 'exception' : undefined} />
              <span className="text-meta text-ink3">Phiên còn {readonly ? '0 (read-only)' : '22 phút'}</span>
            </div>
          </Flex>
          <Descriptions
            className="mt-4"
            items={[
              { label: 'Người dùng', children: userName },
              { label: 'Quyền hạn', children: <Badge variant="failed">ADMIN</Badge> },
              { label: 'Workspace key', children: <span className="font-mono text-label">{readonly ? '••••••••' : 'ws_orca_prod_01'}</span> },
              { label: 'MFA', children: <Badge variant="done">bật</Badge> },
            ]}
          />
        </Card>

        {/* Records — toolbar + 3 state + Popconfirm đỏ + mask readonly */}
        <Card title="Token & quyền truy cập hệ thống">
          <Flex gap="small" wrap className="items-center">
            <div className="w-56">
              <Input.Search aria-label="Tìm token" placeholder="Người hoặc hệ thống…" onSearch={setQuery} />
            </div>
            <Select
              ariaLabel="Lọc quyền hạn"
              className="w-36"
              value={clearanceFilter}
              onChange={(v) => setClearanceFilter(String(v))}
              options={[
                { label: 'Mọi quyền', value: 'all' },
                { label: 'Admin', value: 'admin' },
                { label: 'Editor', value: 'editor' },
                { label: 'Viewer', value: 'viewer' },
              ]}
            />
            <span className="ml-auto flex items-center gap-3 text-label text-ink3">
              Skeleton <Switch checked={loading} onChange={setLoading} aria-label="Demo skeleton" size="small" />
              Error <Switch checked={apiError} onChange={setApiError} aria-label="Demo lỗi API" size="small" />
            </span>
          </Flex>

          {apiError && (
            <Flex gap="middle" className="mt-3 items-center">
              <Alert type="error" message="Không tải được danh sách token" description="GET /api/tokens 503 (demo)." />
              <Button size="small" onClick={() => setApiError(false)}>Thử lại</Button>
            </Flex>
          )}

          <div className="mt-3">
            <Table
              columns={[
                { key: 'person', title: 'Người', render: (r: AccessRecord) => (
                  <span className="flex items-center gap-2">
                    <Avatar size={22}>{r.person.charAt(0)}</Avatar>
                    <span className="text-body text-ink">{r.person}</span>
                  </span>
                ) },
                { key: 'system', title: 'Hệ thống' },
                { key: 'clearance', title: 'Quyền', render: (r: AccessRecord) => (
                  <Badge variant={CLEARANCE_BADGE[r.clearance].variant}>{CLEARANCE_BADGE[r.clearance].label}</Badge>
                ) },
                { key: 'token', title: 'Token', render: (r: AccessRecord) => (
                  <Tooltip title={readonly ? 'Read-only — token bị che' : r.token}>
                    <span className="font-mono text-label">{readonly ? '••••••••' : r.token}</span>
                  </Tooltip>
                ) },
                { key: 'lastSeen', title: 'Hoạt động cuối', render: (r: AccessRecord) => <span className="text-meta text-ink3">{r.lastSeen}</span> },
                {
                  key: 'act', title: '', render: (r: AccessRecord) => (
                    <Popconfirm
                      open={deletingId === r.id}
                      title={`Thu hồi token ${r.token}?`}
                      description="Người dùng mất truy cập ngay lập tức."
                      okText="Thu hồi" danger
                      onConfirm={() => { guard(() => removeRecord(r)); setDeletingId(null); }}
                      onCancel={() => setDeletingId(null)}
                    >
                      <Button
                        type="text" size="small" danger
                        disabled={readonly}
                        onClick={() => (readonly ? guard(() => {}) : setDeletingId(r.id))}
                      >
                        Thu hồi
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]}
              dataSource={filtered}
              rowKey="id"
              scroll={{ y: 300 }}
              striped
              selectionMode="checkbox"
              selectedRowKeys={selectedKeys}
              onSelectionChange={(rows) =>
                guard(() => setSelectedKeys(rows.map((r) => String((r as AccessRecord).id))))
              }
              paginator
              pageSize={6}
              loading={loading}
              emptyMessage={<p className="p-6 text-body text-ink3">Không có token khớp bộ lọc.</p>}
              summary={(page) => (
                <div className="flex items-center justify-between text-label text-ink2">
                  <span>{page.length} token trên trang</span>
                  {selectedKeys.length > 0 && (
                    <Popconfirm
                      open
                      title={`Thu hồi ${selectedKeys.length} token đã chọn?`} danger
                      okText="Thu hồi"
                      onConfirm={() => {
                        guard(() => {
                          setRecords((prev) => prev.filter((t) => !selectedKeys.includes(t.id)));
                          log(`Batch thu hồi ${selectedKeys.length} token`, 'var(--st-fail)');
                          message.success(`Đã thu hồi ${selectedKeys.length} token.`);
                          setSelectedKeys([]);
                        });
                      }}
                      onCancel={() => setSelectedKeys([])}
                    >
                      <Button type="text" danger>Thu hồi ({selectedKeys.length})</Button>
                    </Popconfirm>
                  )}
                </div>
              )}
            />
          </div>
        </Card>

        {/* Audit log — Timeline LIVE */}
        <Card title="Audit log" extra={<Badge variant="doing">real-time</Badge>}>
          <Timeline
            items={audit.map((a) => ({ key: a.key, color: a.color, children: a.children, label: a.label }))}
          />
        </Card>

        <div className="text-meta text-ink3">
          Watermark theo tên <strong className="text-ink">{userName.toUpperCase()}</strong> — đổi ô
          tên ở Hồ sơ phiên để thấy tile re-bake. Mọi thao tác ghi vào Audit log.
        </div>
      </div>
    </Watermark>
  );
}

/** Secure Portal — watermark user-name nền toàn trang + token table + audit timeline. */
export const SecurePortal: Story = {
  name: 'Secure Portal — watermark + readonly + audit (live state)',
  render: () => <SecurePortalDemo />,
};

export const DarkTheme: Story = {
  name: 'DarkTheme — portal tối, watermark white/60 tile',
  render: () => (
    <div data-bp-theme="dark" className="min-h-screen">
      <SecurePortalDemo />
    </div>
  ),
};
