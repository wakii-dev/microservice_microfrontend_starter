// Kitchen Sink — full tour một trang ghép đa số component của ui-kit theo section
// có nghĩa (Hero → Layout → Feedback → Overlay → Data → Forms → Nav → Mới).
// Mục đích: điểm chạm trực quan cho user xem thử cả hệ trước khi vào story từng
// component. Mọi API dùng dưới đây đã verify theo source (2026-10-18, worker D).
// Component chưa có trên tree lúc viết: Kanban — bỏ section, xem report mission.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Field,
  Flex,
  Galleria,
  Input,
  MegaMenu,
  Menu,
  Paragraph,
  Modal,
  notification,
  Pagination,
  Popconfirm,
  Popover,
  Progress,
  QRCode,
  RadioGroup,
  Row,
  Segmented,
  Select,
  SlideMenu,
  Slider,
  Spinner,
  Statistic,
  Steps,
  Switch,
  Table,
  Tabs,
  Tag,
  Text,
  Timeline,
  Timesheet,
  Title,
  Tour,
  Tooltip,
  Watermark,
  message,
} from './index';
// OrgChart (worker V2) chưa lên barrel — import thẳng source, khỏi đụng nhánh của V2
import { OrgChart, type OrgChartNodeData } from './ui/org-chart/index.js';

const meta = {
  title: 'Domain/Kitchen Sink',
  tags: ['!dev'],
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

/** Chuẩn hoá onChange Select (single string | mảng multi-mode) về 1 string cho demo. */
function pickOne(v: string | string[]): string {
  return Array.isArray(v) ? v[0] : v;
}

const TASKS = [
  { key: 'ks-t1', name: 'Đồng bộ Kafka events', status: 'done', assignee: 'Alice' },
  { key: 'ks-t2', name: 'Design tokens v2', status: 'doing', assignee: 'Bob' },
  { key: 'ks-t3', name: 'Gateway rate-limit', status: 'todo', assignee: 'Carol' },
] as const;

const TIMESHEET_ROWS = [
  { key: 'ks-ts1', label: 'UI redesign', meta: 'VU-53', values: [4, 6, 2, 8, 7, 0, 0] },
  { key: 'ks-ts2', label: 'Gateway spike', meta: 'VU-51', values: [2, 0, 5, 1, 3, 2, 0] },
];

const MEGA_ITEMS = [
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
      {
        key: 'admin',
        label: 'Quản trị',
        items: [
          { key: 'members', label: 'Members' },
          { key: 'audit', label: 'Audit log', danger: true },
        ],
      },
    ],
  },
  { key: 'pricing', label: 'Giá', onClick: () => message.info('Pricing (demo)') },
];

const SLIDE_ITEMS = [
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

const ORG_DATA: OrgChartNodeData = {
  key: 'ceo',
  label: 'Alice Nguyễn',
  type: 'dept',
  children: [
    {
      key: 'eng-lead',
      label: 'Bob — FE lead',
      children: [
        { key: 'fe-1', label: 'Carol' },
        { key: 'fe-2', label: 'Dave' },
      ],
    },
    { key: 'ops-lead', label: 'Erin — Ops' },
  ],
};

const GALLERY = [
  { src: 'https://picsum.photos/seed/ks-a/640/420', alt: 'Slide demo A', caption: 'Dashboard concept' },
  { src: 'https://picsum.photos/seed/ks-b/640/420', alt: 'Slide demo B', caption: 'Kanban board' },
  { src: 'https://picsum.photos/seed/ks-c/640/420', alt: 'Slide demo C', caption: 'Timeline feed' },
];

function SectionHead({ id, title, sub }: { id: string; title: string; sub: string }) {
  return (
    <div id={id} className="scroll-mt-6">
      <Title level={2} className="mb-1">
        {title}
      </Title>
      <Text type="secondary">{sub}</Text>
      <Divider className="my-4" />
    </div>
  );
}

function KitchenSinkTour() {
  // ── Overlay states ──
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // ── Form states ──
  const [name, setName] = useState('Alice Nguyễn');
  const [role, setRole] = useState('dev');
  const [due, setDue] = useState(new Date());
  const [notify, setNotify] = useState(true);
  const [progress, setProgress] = useState(64);
  const [urgent, setUrgent] = useState(false);
  const [priority, setPriority] = useState('high');
  const [view, setView] = useState('board');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(2);

  return (
    <div className="mx-auto max-w-5xl p-6 text-body text-ink2">
      {/* ═══ HERO ═══ */}
      <div id="ks-hero">
        <Badge count={12} overflowCount={99}>
          <Title level={1} className="!mb-2">
            Kitchen Sink — @wakii/ui-kit
          </Title>
        </Badge>
        <Paragraph className="max-w-2xl">
          Một trang chạy thử toàn bộ design system: layout, feedback, overlay, data, form,
          navigation và các component mới. Token-only — bật <code>data-bp-theme=&quot;dark&quot;</code> là
          cả trang theo dark.
        </Paragraph>
        <Flex gap="middle" wrap className="mt-4 items-center">
          <Button type="primary">Primary</Button>
          <Button>Default</Button>
          <Button type="text">Text</Button>
          <Button danger type="primary">
            Danger
          </Button>
          <Button loading>Submitting…</Button>
          <Tag closable onClose={() => message.info('Tag đóng — consumer tự xoá khỏi state')}>
            tag-closable
          </Tag>
          <Badge variant="doing">Đang làm</Badge>
          <Badge variant="done">Đã xong</Badge>
        </Flex>
      </div>

      <Divider className="my-8" />

      {/* ═══ LAYOUT ═══ */}
      <SectionHead id="ks-layout" title="Layout" sub="Row/Col 24-col responsive + Flex toolbar + Statistic KPI" />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="Người dùng" value="1,284" suffix="+12%" valueStyle={{ color: 'var(--st-done)' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="Tasks mở" value="316" suffix="+5%" valueStyle={{ color: 'var(--st-doing)' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="Quá hạn" value="18" suffix="-3" valueStyle={{ color: 'var(--st-fail)' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="Uptime" value="99.98%" suffix="30 ngày" />
          </Card>
        </Col>
      </Row>
      <Card className="mt-4">
        <Flex gap="middle" wrap className="items-center">
          <Segmented
            options={[
              { label: 'Board', value: 'board' },
              { label: 'List', value: 'list' },
            ]}
            value={view}
            onChange={setView}
          />
          <Input.Search
            className="w-64"
            placeholder="Tìm task…"
            enterButton
            onSearch={(q) => message.info(`Tìm: ${q}`)}
          />
          <Select
            className="w-44"
            ariaLabel="Lọc trạng thái"
            value={statusFilter}
            onChange={(v) => setStatusFilter(pickOne(v))}
            options={[
              { label: 'Tất cả', value: 'all' },
              { label: 'Đang làm', value: 'doing' },
              { label: 'Đã xong', value: 'done' },
            ]}
          />
          <Button type="primary" onClick={() => setModalOpen(true)}>
            + Task mới
          </Button>
        </Flex>
        <div className="mt-3 text-meta text-ink3">
          Toolbar view: {view} · filter: {statusFilter}
        </div>
      </Card>

      {/* ═══ FEEDBACK ═══ */}
      <SectionHead id="ks-feedback" title="Feedback" sub="Alert · message/notification · Progress · Spinner" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Alert type="success" message="Đã lưu task" description="Persist qua node-svc + outbox event." />
        <Alert type="info" message="Có bản cập nhật mới" variant="outlined" />
        <Alert type="warning" message="Sắp quá hạn" description="2 task hết hạn trong 24 giờ tới." variant="outlined" />
        <Alert type="error" message="Gán thất bại" description="Saga bắn assignment_failed → DLQ." />
      </div>
      <Card className="mt-4">
        <Flex gap="middle" wrap className="items-center">
          <Button onClick={() => message.success('Đã lưu task')}>message.success</Button>
          <Button onClick={() => message.error('Lỗi kết nối gateway')}>message.error</Button>
          <Button
            type="primary"
            onClick={() => notification.info('Kafka event', 'task.updated — activity feed đã cập nhật.')}
          >
            notification.info
          </Button>
          <div className="w-48">
            <Progress percent={progress} />
          </div>
          <Spinner label="Đang đồng bộ" size="small" />
          <Button size="small" onClick={() => setProgress((p) => (p + 20) % 120 || 20)}>
            progress ±20
          </Button>
        </Flex>
      </Card>

      {/* ═══ OVERLAY ═══ */}
      <SectionHead id="ks-overlay" title="Overlay" sub="Modal · Drawer · Popover · Popconfirm · Tooltip · Tour" />
      <Card>
        <Flex gap="middle" wrap>
          <Button type="primary" onClick={() => setModalOpen(true)}>
            Modal
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>Drawer</Button>
          <Popover trigger="click" title="Popover" content="Panel nội dung tự do — list, link, action.">
            <Button>Popover</Button>
          </Popover>
          <Popconfirm
            open={confirmOpen}
            title="Xoá task này?"
            description="Không thể hoàn tác."
            danger
            okText="Xoá"
            onConfirm={() => {
              setConfirmOpen(false);
              message.success('Đã xoá (demo)');
            }}
            onCancel={() => setConfirmOpen(false)}
          >
            <Button danger onClick={() => setConfirmOpen(true)}>
              Popconfirm
            </Button>
          </Popconfirm>
          <Tooltip title="Tooltip — hint 1 dòng khi hover">
            <Button>Tooltip</Button>
          </Tooltip>
          <Button type="text" onClick={() => setTourOpen(true)}>
            ▶ Chạy tour trang
          </Button>
        </Flex>
      </Card>

      {/* ═══ DATA ═══ */}
      <SectionHead id="ks-data" title="Data" sub="Table (expandable) · Tabs · Timeline · Descriptions · Galleria" />
      <Card>
        <Table
          columns={[
            { key: 'name', title: 'Task' },
            {
              key: 'status',
              title: 'Trạng thái',
              render: (row: (typeof TASKS)[number]) => (
                <Badge variant={row.status as 'todo' | 'doing' | 'done'}>{row.status}</Badge>
              ),
            },
            { key: 'assignee', title: 'Assignee' },
          ]}
          dataSource={[...TASKS]}
          rowKey="key"
          expandable={{
            expandedRowRender: (row: (typeof TASKS)[number]) => (
              <span className="text-body text-ink2">Chi tiết {row.name} — đã sync qua gateway :8080.</span>
            ),
          }}
        />
        <Divider className="my-4" />
        <Tabs
          items={[
            { key: 'feed', label: 'Feed', children: <div className="p-2">Activity stream real-time qua go-svc.</div> },
            { key: 'meta', label: 'Meta', children: <div className="p-2">Contract-first: openapi → codegen types.</div> },
          ]}
        />
        <Divider className="my-4" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Timeline
            items={[
              { key: 't1', children: 'Alice tạo task', label: '10 phút trước' },
              { key: 't2', color: 'var(--st-done)', children: 'Bot sync Kafka', label: '1 giờ trước' },
              { key: 't3', color: 'var(--st-fail)', children: 'Saga gán thất bại → DLQ', label: '2 giờ trước' },
            ]}
          />
          <Descriptions
            title="Chi tiết task"
            bordered
            items={[
              { label: 'Người tạo', children: 'Alice (admin)' },
              { label: 'Dự án', children: 'VU-53 UI redesign' },
              { label: 'Ưu tiên', children: <Badge variant="failed">Cao</Badge> },
            ]}
          />
        </div>
        <Divider className="my-4" />
        <div className="max-w-xl">
          <Galleria images={GALLERY} />
        </div>
      </Card>

      {/* ═══ FORMS ═══ */}
      <SectionHead id="ks-forms" title="Forms" sub="Field · Input · Select · DatePicker · Switch · Slider · Checkbox · Radio" />
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên hiển thị" htmlFor="ks-name" required>
            <Input id="ks-name" value={name} onChange={(e) => setName(e.target.value)} allowClear />
          </Field>
          <Field label="Vai trò">
            <Select
              ariaLabel="Vai trò"
              className="w-full"
              value={role}
              onChange={(v) => setRole(pickOne(v))}
              options={[
                { label: 'Developer', value: 'dev' },
                { label: 'Designer', value: 'design' },
                { label: 'QA', value: 'qa' },
              ]}
            />
          </Field>
          <Field label="Hạn chót">
            <DatePicker value={due} onChange={setDue} />
          </Field>
          <Field label="Tiến độ" htmlFor="ks-progress">
            <div className="pt-2">
              <Slider ariaLabel="Tiến độ" value={progress} onChange={setProgress} />
            </div>
          </Field>
          <Flex gap="middle" className="items-center">
            <Switch checked={notify} onChange={setNotify} aria-label="Nhận thông báo" />
            <span>Nhận thông báo</span>
            <Checkbox checked={urgent} onChange={setUrgent}>
              Ưu tiên khẩn
            </Checkbox>
          </Flex>
          <RadioGroup
            value={priority}
            onChange={setPriority}
            options={[
              { label: 'Cao', value: 'high' },
              { label: 'Trung bình', value: 'mid' },
              { label: 'Thấp', value: 'low' },
            ]}
          />
        </div>
      </Card>

      {/* ═══ NAV ═══ */}
      <SectionHead id="ks-nav" title="Navigation" sub="Steps · Breadcrumb · Pagination · Menu ngang" />
      <Card>
        <Steps
          current={1}
          items={[
            { title: 'Chọn loại', description: 'Task hay bug' },
            { title: 'Điền thông tin', description: 'Tiêu đề + assignee' },
            { title: 'Xác nhận', description: 'Review rồi tạo' },
          ]}
        />
        <Divider className="my-4" />
        <Breadcrumb
          items={[{ title: 'Projects', href: '#' }, { title: 'VU-53', href: '#' }, { title: 'UI redesign' }]}
        />
        <Divider className="my-4" />
        <Flex gap="large" wrap className="items-center">
          <Menu
            mode="horizontal"
            selectedKey="tasks"
            onSelect={(k) => message.info(`Chuyển tới ${k}`)}
            items={[
              { key: 'dash', label: 'Dashboard' },
              { key: 'tasks', label: 'Tasks' },
              { key: 'reports', label: 'Reports' },
            ]}
          />
          <Pagination current={page} pageSize={10} total={47} onChange={setPage} />
        </Flex>
      </Card>

      {/* ═══ NAV ADVANCED ═══ */}
      <SectionHead
        id="ks-nav-advanced"
        title="Nav advanced"
        sub="MegaMenu panel đa cột · SlideMenu trượt cấp · OrgChart mini"
      />
      {/* MegaMenu KHÔNG bọc Card — Card overflow-hidden sẽ clip panel dropdown */}
      <div className="rounded-xl border border-line bg-s1 p-2">
        <MegaMenu items={MEGA_ITEMS} className="rounded-lg" />
        <Text type="secondary" className="ml-2 text-meta">
          Hover/click ‘Sản phẩm’ — panel 3 cột; ESC hoặc click ngoài để đóng.
        </Text>
      </div>
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={12}>
          <Card title="SlideMenu — trượt cấp" className="h-full">
            <SlideMenu items={SLIDE_ITEMS} ariaLabel="Menu đa cấp" className="w-full" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="OrgChart mini" className="h-full">
            <OrgChart data={ORG_DATA} selectedKey="eng-lead" />
          </Card>
        </Col>
      </Row>

      {/* ═══ MỚI ═══ */}
      <SectionHead
        id="ks-new"
        title="Mới trong đợt này"
        sub="Timesheet (trong Watermark) · QRCode · Tour — Kanban chưa có trên tree, bỏ qua"
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Watermark content={['INTERNAL REVIEW', 'wakii © 2026']} className="rounded-xl">
            <Card title="Timesheet tuần này" extra={<Badge variant="created">Mới</Badge>}>
              <Timesheet rows={TIMESHEET_ROWS} week={new Date()} editable />
            </Card>
          </Watermark>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="QRCode + Galleria đã xem phía trên" className="h-full">
            <Flex gap="large" className="items-center">
              <QRCode value="https://demo.wakii.dev/invite/ks" size={120} />
              <div className="text-body text-ink2">
                Quét để mở workspace demo.
                <br />
                <Text type="secondary" className="text-meta">
                  SVG tự sinh — không deps runtime.
                </Text>
              </div>
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* ═══ Overlay instances (đặt cuối — portal/position absolute) ═══ */}
      <Modal
        open={modalOpen}
        title="Task mới"
        onOk={() => {
          setModalOpen(false);
          message.success('Đã tạo (demo)');
        }}
        onCancel={() => setModalOpen(false)}
      >
        <Field label="Tiêu đề" htmlFor="ks-modal-title" required>
          <Input id="ks-modal-title" placeholder="Ví dụ: Sửa bug đăng nhập…" allowClear />
        </Field>
      </Modal>
      <Drawer open={drawerOpen} title="Chi tiết nhanh" width={380} onClose={() => setDrawerOpen(false)}>
        <Descriptions
          items={[
            { label: 'Task', children: TASKS[1].name },
            { label: 'Assignee', children: TASKS[1].assignee },
          ]}
        />
      </Drawer>
      <Tour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        steps={[
          { target: '#ks-hero', title: 'Hero', description: 'Toàn bộ primitives cốt lõi nằm ở đây.' },
          { target: '#ks-layout', title: 'Layout', description: 'Row/Col + Flex — xương sống mọi trang.' },
          { target: '#ks-overlay', title: 'Overlay', description: 'Modal, Drawer, Popover… bấm thử từng nút.' },
          { target: '#ks-nav-advanced', title: 'Nav advanced', description: 'MegaMenu đa cột, SlideMenu trượt cấp, OrgChart.' },
          { target: '#ks-new', title: 'Mới', description: 'Timesheet, Watermark, QRCode vừa lên đời.' },
        ]}
      />
    </div>
  );
}

export const FullTour: Story = {
  name: 'Kitchen Sink — full tour',
  render: () => <KitchenSinkTour />,
};
