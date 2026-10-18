// ComponentsDemo — gallery nhanh các primitives: Button/Badge/Tag/Alert/Progress/
// message/controls (batch ⑦). Còn lại xem Storybook :6006.
import { useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Icon,
  Progress,
  RadioGroup,
  Switch,
  Tag,
  message,
} from '@wakii/ui-kit';

export function ComponentsDemo() {
  const [switchOn, setSwitchOn] = useState(true);
  const [digest, setDigest] = useState('daily');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="m-0 text-h1 font-semibold text-ink">Components</h1>
        <p className="mt-1 mb-0 text-body text-ink3">
          Gallery nhanh — full variants + docs sống tại Storybook :6006.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Buttons">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="primary">Primary</Button>
            <Button>Default</Button>
            <Button type="text">Text</Button>
            <Button danger>Danger</Button>
            <Button type="primary" loading>
              Loading
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </Card>

        <Card title="Badge — 9 variants">
          <div className="flex flex-wrap gap-2">
            {(['todo', 'doing', 'done', 'failed', 'created', 'updated', 'assigned', 'deleted', 'assignmentFailed'] as const).map(
              (variant) => (
                <Badge key={variant} variant={variant}>
                  {variant}
                </Badge>
              ),
            )}
          </div>
        </Card>

        <Card title="Tag — closable">
          <div className="flex flex-wrap gap-2">
            <Tag closable onClose={() => message.info('Đóng tag (demo)')}>
              react
            </Tag>
            <Tag closable onClose={() => message.info('Đóng tag (demo)')}>
              module-federation
            </Tag>
            <Tag icon={<Icon name="check" size={10} />}>kafka</Tag>
          </div>
        </Card>

        <Card title="Alert — 4 types">
          <div className="flex flex-col gap-2">
            <Alert type="success" message="Đã lưu thay đổi" />
            <Alert type="warning" message="Sắp vượt quota storage" />
            <Alert type="error" message="Saga thất bại — xem DLQ" />
          </div>
        </Card>

        <Card title="Progress + Avatar">
          <div className="flex flex-col gap-3">
            <Progress percent={40} />
            <Progress percent={72} />
            <Progress percent={100} status="success" />
            <Progress percent={30} status="exception" />
            <div className="flex items-center gap-2">
              <Avatar>AL</Avatar>
              <Avatar src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%231677ff'/%3E%3C/svg%3E" alt="Avatar demo" />
              <span className="text-meta text-ink3">Avatar init + src</span>
            </div>
          </div>
        </Card>

        <Card title="Controls + message">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-body text-ink">
              <Checkbox defaultChecked onChange={() => message.success('Checkbox (demo)')} />
              Nhận email thông báo
            </label>
            <div className="flex items-center gap-2 text-body text-ink">
              <Switch checked={switchOn} onChange={setSwitchOn} aria-label="Chế độ thử nghiệm" />
              Chế độ thử nghiệm
            </div>
            <RadioGroup
              value={digest}
              onChange={setDigest}
              options={[
                { label: 'Hàng ngày', value: 'daily' },
                { label: 'Hàng tuần', value: 'weekly' },
              ]}
            />
            <div className="flex gap-2">
              <Button size="small" onClick={() => message.success('Thành công!')}>
                success
              </Button>
              <Button size="small" onClick={() => message.error('Thất bại!')}>
                error
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
