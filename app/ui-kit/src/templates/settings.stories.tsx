// Templates/Settings — trang cài đặt admin: rail TRÁI = Menu dọc (Tabs chưa có
// tabPosition vertical — antd Settings gốc cũng dùng menu dọc) + 4 panel:
// Account (Avatar + Descriptions + Field form) · Security (Password showStrength
// + InputOTP 2FA + useCountdown resend) · Notifications (Switch matrix +
// Checkbox + message save) · Appearance (Segmented density + ColorPicker đổi
// accent LIVE qua UiKitProvider theme object + dark preview).
// 100% components của kit · tokens-only · accent LIVE nhờ UiKitProvider ghi
// cặp --var lên scope con (không React context — CSS var cascade).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCountdown } from '../hooks/useCountdown.js';
import { UiKitProvider } from '../provider/index.js';
import { Avatar } from '../ui/avatar/index';
import { Button } from '../ui/button/index';
import { Card } from '../ui/card/index';
import { Checkbox } from '../ui/checkbox/index';
import { ColorPicker } from '../ui/color-picker/index';
import { Descriptions } from '../ui/descriptions/index';
import { Divider } from '../ui/divider/index';
import { Field } from '../ui/field/index';
import { Icon } from '../ui/icons/index.js';
import { Input } from '../ui/input/index';
import { InputOTP } from '../ui/input-otp/index';
import { Layout } from '../ui/layout/index';
import { Menu, type MenuItemData } from '../ui/menu/index';
import { message } from '../ui/message/index.js';
import { Password } from '../ui/password/index';
import { Segmented } from '../ui/segmented/index';
import { Switch } from '../ui/switch/index';
import { Tag } from '../ui/tag/index';

const meta = { title: 'Templates/Settings', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

/** Settings — 4 nhóm cài đặt (Account/Security/Notifications/Appearance) trên shell Layout. */
export const Settings: S = {
  render: () => <SettingsTemplate />,
};

const SECTIONS: MenuItemData[] = [
  { key: 'account', label: 'Tài khoản', icon: <Icon name="user" size={14} /> },
  { key: 'security', label: 'Bảo mật', icon: <Icon name="eye-slash" size={14} /> },
  { key: 'notifications', label: 'Thông báo', icon: <Icon name="bell" size={14} /> },
  { key: 'appearance', label: 'Giao diện', icon: <Icon name="settings" size={14} /> },
];

// ── Account — Avatar + Descriptions + Field form ──
function AccountPanel() {
  const [name, setName] = useState('Alice Nguyễn');
  const [email, setEmail] = useState('alice@demo.local');
  return (
    <Card title="Hồ sơ">
      <div className="flex items-center gap-4">
        <Avatar size={56}>A</Avatar>
        <div className="flex flex-col items-start gap-1">
          <span className="text-body font-semibold text-ink">{name}</span>
          <span className="text-meta text-ink3">Admin · Đội Frontend</span>
          <Button size="small" onClick={() => message.info('Upload avatar — demo qua UploadDropzone')}>
            Đổi ảnh
          </Button>
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

// ── Security — Password + InputOTP + useCountdown resend ──
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

// ── Notifications — Switch matrix + Checkbox + message save ──
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

// ── Appearance — Segmented density + ColorPicker accent LIVE + dark preview ──
const DENSITY = [
  { label: 'Dày đặc', value: 'compact' },
  { label: 'Vừa', value: 'default' },
  { label: 'Thưa', value: 'comfortable' },
];

const ACCENT_PRESETS = ['#1677ff', '#5e6ad2', '#7c3aed', '#0d9488', '#ea580c', '#e11d48'];

function AppearancePanel() {
  const [density, setDensity] = useState('default');
  const [accent, setAccent] = useState('#1677ff');
  return (
    <div className="grid gap-4">
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
          <span className="text-meta text-ink3">Áp dụng cho Table, List và grid dữ liệu</span>
        </div>
      </Card>
      <Card title="Màu nhận diện">
        <div className="flex flex-wrap items-center gap-4">
          <ColorPicker value={accent} presets={ACCENT_PRESETS} onChange={setAccent} />
          <span className="text-meta text-ink3 tabular-nums">{accent}</span>
        </div>
        {/* LIVE: UiKitProvider ghi --accent/--accent-hi lên scope con — accent đổi tức thì */}
        <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
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
        </div>
      </Card>
      <Card title="Xem trước dark">
        <UiKitProvider theme="dark">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas p-4">
            <Button type="primary">Nút chính</Button>
            <Tag icon={<Icon name="check-circle" size={12} />}>Đã hoàn thành</Tag>
            <Switch checked onChange={() => {}} aria-label="Switch dark demo" />
            <span className="text-body text-ink">Chữ trên nền canvas tối</span>
          </div>
        </UiKitProvider>
        <p className="mb-0 mt-2 text-meta text-ink3">
          Dark ăn nhờ cascade <code className="font-mono">data-bp-theme="dark"</code> — component không code riêng cho dark.
        </p>
      </Card>
    </div>
  );
}

function SettingsTemplate() {
  const [section, setSection] = useState('account');
  return (
    <Layout className="min-h-screen">
      <Layout.Header sticky>
        <span className="text-h3 font-semibold text-ink">Cài đặt</span>
        <span className="ml-auto flex items-center gap-2">
          <Avatar size={28}>A</Avatar>
          <span className="text-label text-ink2">alice@demo.local</span>
        </span>
      </Layout.Header>
      <Layout.Content>
        <div className="mx-auto grid w-full max-w-5xl gap-6 p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Rail trái — Menu dọc (Tabs chưa hỗ trợ tabPosition vertical) */}
          <nav aria-label="Nhóm cài đặt">
            <Menu items={SECTIONS} selectedKey={section} onSelect={setSection} />
          </nav>
          {section === 'account' && <AccountPanel />}
          {section === 'security' && <SecurityPanel />}
          {section === 'notifications' && <NotificationsPanel />}
          {section === 'appearance' && <AppearancePanel />}
        </div>
      </Layout.Content>
      <Layout.Footer>© 2026 Wakii Admin — Template demo</Layout.Footer>
    </Layout>
  );
}
