// Settings — trang cài đặt theo Templates/Settings (templates-settings--settings):
// rail TRÁI Menu dọc + panels — Tài khoản (Avatar + Descriptions + Field form +
// UploadDropzone avatar) · Chung (Tabs 2 tab: Workspace form zod / Vùng & thông báo)
// · Bảo mật (Password showStrength + InputOTP 2FA + useCountdown resend) · Thông báo
// (Switch matrix + Checkbox) · Giao diện (Segmented light/dark LIVE toàn app qua
// useTheme + ColorPicker accent LIVE qua UiKitProvider nested + preview dark).
// 100% components của kit · tokens-only · accent LIVE nhờ UiKitProvider ghi cặp
// --var lên scope con (không React context — CSS var cascade).
import { useState } from 'react';
import { z } from 'zod';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  ColorPicker,
  Descriptions,
  Divider,
  Field,
  Icon,
  Input,
  InputNumber,
  InputOTP,
  Menu,
  message,
  Password,
  Popconfirm,
  RadioGroup,
  Segmented,
  Switch,
  Tabs,
  Tag,
  TreeSelect,
  UiKitProvider,
  UploadDropzone,
  useCountdown,
  useForm,
  type MenuItemData,
} from '@wakii/ui-kit';
import { useTheme } from '../theme.js';

const SECTIONS: MenuItemData[] = [
  { key: 'account', label: 'Tài khoản', icon: <Icon name="user" size={14} /> },
  { key: 'general', label: 'Chung', icon: <Icon name="file" size={14} /> },
  { key: 'security', label: 'Bảo mật', icon: <Icon name="eye-slash" size={14} /> },
  { key: 'notifications', label: 'Thông báo', icon: <Icon name="bell" size={14} /> },
  { key: 'appearance', label: 'Giao diện', icon: <Icon name="settings" size={14} /> },
];

// ── Tài khoản — Avatar + Descriptions + Field form + avatar upload ──
function AccountPanel() {
  const [name, setName] = useState('Alice Nguyễn');
  const [email, setEmail] = useState('alice@demo.local');
  return (
    <Card title="Hồ sơ">
      <div className="flex items-start gap-4">
        <Avatar size={56}>A</Avatar>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="text-body font-semibold text-ink">{name}</span>
          <span className="text-meta text-ink3">Admin · Đội Frontend</span>
          {/* Avatar upload — Dropzone mini (R11: profile avatar upload) */}
          <div className="w-full max-w-sm">
            <UploadDropzone
              accept="image/*"
              maxCount={1}
              onChange={(files) =>
                message.success(files.length ? `Đã nhận ${files[0].name} — crop + lưu (demo).` : 'Đã xoá avatar')
              }
            />
          </div>
        </div>
      </div>
      <Descriptions
        className="mt-4"
        items={[
          { label: 'User ID', children: <span className="font-mono text-label">usr_01HQX7K2</span> },
          { label: 'Email', children: <span className="text-body">{email}</span> },
          { label: 'Vai trò', children: <Tag>Admin</Tag> },
          { label: 'Múi giờ', children: <span className="text-body">Asia/Ho_Chi_Minh (UTC+7)</span> },
        ]}
      />
      <div className="mt-6 grid max-w-md gap-4">
        <Field label="Tên hiển thị" htmlFor="set-name" required>
          <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="set-email" hint="Dùng cho đăng nhập + thông báo">
          <Input id="set-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <div>
          <Button type="primary" onClick={() => message.success('Đã lưu hồ sơ')}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Chung — Tabs 2 tab (Workspace form zod / Vùng & thông báo) ──
const REGION_TREE = [
  {
    value: 'vn',
    label: 'Việt Nam',
    children: [
      { value: 'vn-hn', label: 'Hà Nội' },
      { value: 'vn-hcm', label: 'TP. Hồ Chí Minh' },
      { value: 'vn-dn', label: 'Đà Nẵng' },
    ],
  },
  {
    value: 'jp',
    label: 'Nhật Bản',
    children: [{ value: 'jp-tyo', label: 'Tokyo' }],
  },
];

interface GeneralValues {
  siteName: string;
  retentionDays: number;
  darkByDefault: boolean;
  region: string;
  digest: string;
}

const generalSchema = z.object({
  siteName: z.string().min(2, 'Tên site tối thiểu 2 ký tự'),
  retentionDays: z.number().min(1, 'Tối thiểu 1 ngày').max(365, 'Tối đa 365 ngày'),
  darkByDefault: z.boolean(),
  region: z.string().min(1, 'Chọn vùng dữ liệu'),
  digest: z.string(),
});

function GeneralPanel() {
  const { mode, setMode } = useTheme();
  const [tab, setTab] = useState('workspace');
  const form = useForm<GeneralValues>({
    schema: generalSchema,
    initialValues: { siteName: 'Wakii Admin', retentionDays: 30, darkByDefault: mode === 'dark', region: '', digest: 'daily' },
  });

  const save = form.handleSubmit((values) => {
    message.success(`Đã lưu cài đặt — ${values.siteName} (demo)`);
  });

  return (
    <Card title="Cấu hình workspace">
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'workspace',
            label: 'Workspace',
            children: (
              <div className="flex max-w-md flex-col gap-4">
                <Field label="Tên site" htmlFor="set-site-name" required error={form.errors.siteName}>
                  <Input
                    id="set-site-name"
                    name="siteName"
                    value={form.values.siteName}
                    onChange={form.handleChange('siteName')}
                    onBlur={form.handleBlur('siteName')}
                    invalid={!!form.errors.siteName}
                  />
                </Field>
                <Field label="Giữ log (ngày)" htmlFor="set-retention" error={form.errors.retentionDays} hint="1–365 ngày">
                  <InputNumber
                    ariaLabel="Giữ log theo ngày"
                    value={form.values.retentionDays}
                    min={1}
                    max={365}
                    invalid={!!form.errors.retentionDays}
                    onChange={(value) => form.setValue('retentionDays', value ?? 1)}
                  />
                </Field>
                <Field label="Dark mode mặc định" htmlFor="set-dark" hint="Bật/tắt ăn NGAY toàn app (UiKitProvider live)">
                  <div id="set-dark" className="py-1">
                    <Switch
                      checked={form.values.darkByDefault}
                      onChange={(checked) => {
                        form.setValue('darkByDefault', checked);
                        setMode(checked ? 'dark' : 'light');
                      }}
                      aria-label="Dark mode mặc định"
                    />
                  </div>
                </Field>
              </div>
            ),
          },
          {
            key: 'region',
            label: 'Vùng & thông báo',
            children: (
              <div className="flex max-w-md flex-col gap-4">
                <Field label="Vùng dữ liệu" htmlFor="set-region" required error={form.errors.region}>
                  <div id="set-region">
                    <TreeSelect
                      ariaLabel="Chọn vùng dữ liệu"
                      treeData={REGION_TREE}
                      value={form.values.region}
                      onChange={(value) => form.setValue('region', value)}
                      searchable
                      clearable
                      placeholder="Chọn vùng…"
                    />
                  </div>
                </Field>
                <Field label="Email digest" htmlFor="set-digest" hint="Tổng hợp hoạt động gửi qua email">
                  <div id="set-digest" className="py-1">
                    <RadioGroup
                      value={form.values.digest}
                      onChange={(value) => form.setValue('digest', value)}
                      options={[
                        { label: 'Hàng ngày', value: 'daily' },
                        { label: 'Hàng tuần', value: 'weekly' },
                        { label: 'Tắt', value: 'off' },
                      ]}
                    />
                  </div>
                </Field>
              </div>
            ),
          },
        ]}
      />
      <div className="mt-4">
        <Button type="primary" onClick={() => save()}>
          Lưu cài đặt
        </Button>
      </div>
    </Card>
  );
}

// ── Bảo mật — Password + InputOTP + useCountdown resend (parity template) ──
function SecurityPanel() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [otp, setOtp] = useState('');
  const cooldown = useCountdown(30);
  return (
    <Card title="Bảo mật">
      <div className="grid max-w-md gap-4">
        <Field label="Mật khẩu hiện tại" htmlFor="pw-current" required>
          <Password ariaLabel="Mật khẩu hiện tại" value={currentPw} onChange={setCurrentPw} />
        </Field>
        <Field label="Mật khẩu mới" htmlFor="pw-new" hint="Tối thiểu 8 ký tự, chứa chữ + số">
          <Password ariaLabel="Mật khẩu mới" showStrength value={newPw} onChange={setNewPw} />
        </Field>
        <div>
          <Button
            type="primary"
            disabled={!currentPw || newPw.length < 8}
            onClick={() => {
              setCurrentPw('');
              setNewPw('');
              message.success('Đã đổi mật khẩu');
            }}
          >
            Đổi mật khẩu
          </Button>
        </div>
      </div>
      <Divider className="my-6" />
      <div className="grid max-w-md gap-3">
        <span className="text-body font-semibold text-ink">Xác thực 2 lớp (2FA)</span>
        <p className="m-0 text-meta text-ink3">Nhập mã 6 số từ app authenticator để kích hoạt.</p>
        <InputOTP length={6} value={otp} onChange={setOtp} ariaLabel="Mã xác thực 2 lớp" />
        <div className="flex items-center gap-2">
          <Button
            size="small"
            disabled={cooldown.isRunning}
            onClick={() => {
              cooldown.reset();
              cooldown.start();
              message.success('Đã gửi mã mới');
            }}
          >
            {cooldown.isRunning ? `Gửi lại sau ${cooldown.seconds}s` : 'Gửi mã'}
          </Button>
          <Button
            size="small"
            type="primary"
            disabled={otp.length < 6}
            onClick={() => message.success('Đã bật 2FA')}
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Thông báo — Switch matrix + Checkbox + message save (parity template) ──
const CHANNELS = [
  { key: 'email-task', label: 'Email — cập nhật task', desc: 'Gửi khi task được gán hoặc đổi trạng thái' },
  { key: 'push-deadline', label: 'Push — nhắc deadline', desc: 'Thông báo trước hạn chót 1 giờ' },
  { key: 'email-digest', label: 'Email — tổng hợp tuần', desc: 'Gửi mỗi thứ Hai lúc 8:00' },
  { key: 'inapp-mention', label: 'In-app — khi được nhắc', desc: '@mention trong bình luận' },
];

function NotificationsPanel() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    'email-task': true,
    'push-deadline': true,
    'email-digest': false,
    'inapp-mention': true,
  });
  const [quietHours, setQuietHours] = useState(true);
  const [weekend, setWeekend] = useState(false);
  return (
    <Card title="Thông báo">
      <div className="grid">
        {CHANNELS.map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-s3"
          >
            <div className="min-w-0">
              <div className="text-body text-ink">{c.label}</div>
              <div className="text-meta text-ink3">{c.desc}</div>
            </div>
            <Switch
              checked={enabled[c.key] ?? false}
              onChange={(v) => setEnabled((prev) => ({ ...prev, [c.key]: v }))}
              aria-label={c.label}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 border-t border-line2 pt-4">
        <Checkbox checked={quietHours} onChange={setQuietHours}>
          Kênh im lặng 22:00–7:00
        </Checkbox>
        <Checkbox checked={weekend} onChange={setWeekend}>
          Gửi thông báo cả cuối tuần
        </Checkbox>
      </div>
      <div className="mt-4">
        <Button type="primary" onClick={() => message.success('Đã lưu tuỳ chọn thông báo')}>
          Lưu tuỳ chọn
        </Button>
      </div>
    </Card>
  );
}

// ── Giao diện — theme LIVE toàn app + ColorPicker accent LIVE + preview dark ──
const DENSITY = [
  { label: 'Dày đặc', value: 'compact' },
  { label: 'Vừa', value: 'default' },
  { label: 'Thưa', value: 'comfortable' },
];

const ACCENT_PRESETS = ['#1677ff', '#5e6ad2', '#7c3aed', '#0d9488', '#ea580c', '#e11d48'];

function AppearancePanel() {
  const { mode, setMode } = useTheme();
  const [density, setDensity] = useState('default');
  const [accent, setAccent] = useState('#1677ff');
  return (
    <div className="grid gap-4">
      <Card title="Chủ đề">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            aria-label="Chủ đề sáng/tối"
            options={[
              { label: 'Sáng', value: 'light' },
              { label: 'Tối', value: 'dark' },
            ]}
            value={mode}
            onChange={(v) => setMode(v === 'dark' ? 'dark' : 'light')}
          />
          <span className="text-meta text-ink3">Đổi NGAY toàn app — 1 click qua UiKitProvider (không reload).</span>
        </div>
      </Card>
      <Card title="Màu nhận diện">
        <div className="flex flex-wrap items-center gap-4">
          <ColorPicker value={accent} presets={ACCENT_PRESETS} onChange={setAccent} />
          <span className="text-meta text-ink3 tabular-nums">{accent}</span>
        </div>
        {/* LIVE: UiKitProvider ghi --accent/--accent-hi lên scope con — accent đổi tức thì */}
        <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
          <UiKitScope accent={accent} />
        </div>
      </Card>
      <Card title="Xem trước dark">
        <UiKitProviderDarkPreview />
        <p className="mb-0 mt-2 text-meta text-ink3">
          Dark ăn nhờ cascade <code className="font-mono">data-bp-theme="dark"</code> — component không code riêng cho dark.
        </p>
      </Card>
      <Card title="Mật độ hiển thị">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            options={DENSITY}
            value={density}
            onChange={(v) => {
              setDensity(v);
              message.info(`Mật độ bảng + danh sách: ${v}`);
            }}
          />
          <span className="text-meta text-ink3">Áp dụng cho Table, List và grid dữ liệu (demo).</span>
        </div>
      </Card>
    </div>
  );
}

function UiKitScope({ accent }: { accent: string }) {
  return (
    <UiKitProvider theme={{ accent, accentHi: accent }}>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="primary">Nút chính</Button>
        <Button>Nút thường</Button>
        <a
          href="#accent"
          className="text-accent underline-offset-2 hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          Link accent
        </a>
        <Switch checked onChange={() => {}} aria-label="Switch accent demo" />
        <Checkbox checked onChange={() => {}}>
          Checkbox accent
        </Checkbox>
      </div>
    </UiKitProvider>
  );
}

function UiKitProviderDarkPreview() {
  return (
    <UiKitProvider theme="dark">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas p-4">
        <Button type="primary">Nút chính</Button>
        <Tag icon={<Icon name="check-circle" size={12} />}>Đã hoàn thành</Tag>
        <Switch checked onChange={() => {}} aria-label="Switch dark demo" />
        <span className="text-body text-ink">Chữ trên nền canvas tối</span>
      </div>
    </UiKitProvider>
  );
}

// ── Trang Settings — rail Menu trái + panel phải (grid như template) ──
export function Settings() {
  const [section, setSection] = useState('account');
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="m-0 text-h1 font-semibold text-ink">Cài đặt</h1>
        <p className="mb-0 mt-1 text-body text-ink2">Cấu hình workspace — lưu localStorage (demo).</p>
      </div>
      <div className="grid w-full gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Rail trái — Menu dọc (Tabs chưa có tabPosition vertical) */}
        <nav aria-label="Nhóm cài đặt">
          <Menu items={SECTIONS} selectedKey={section} onSelect={setSection} />
        </nav>
        {section === 'account' && <AccountPanel />}
        {section === 'general' && <GeneralPanel />}
        {section === 'security' && <SecurityPanel />}
        {section === 'notifications' && <NotificationsPanel />}
        {section === 'appearance' && <AppearancePanel />}
      </div>
      {/* Popconfirm danger zone mini — parity Patterns (demo không thật) */}
      <Card title="Vùng nguy hiểm" classNames={{ body: 'p-4' }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-label text-ink2">Xoá toàn bộ dữ liệu demo của workspace.</span>
          <Popconfirm
            open
            title="Xoá dữ liệu demo?"
            description="Không thể hoàn tác — toàn bộ data localStorage mất."
            okText="Xoá"
            danger
            onConfirm={() => message.error('Đã yêu cầu xoá (demo — không thật)')}
          >
            <Button danger size="small">
              Xoá dữ liệu demo
            </Button>
          </Popconfirm>
        </div>
      </Card>
    </div>
  );
}
