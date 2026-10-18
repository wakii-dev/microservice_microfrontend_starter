// Settings — Tabs 2 tab (Chung: Input/InputNumber/Switch; Vùng: TreeSelect + Radio),
// form useForm ui-kit + zod, nút Lưu → Field lỗi hiện đúng (batch ⑦).
import { useState } from 'react';
import { z } from 'zod';
import {
  Button,
  Field,
  Input,
  InputNumber,
  RadioGroup,
  Switch,
  Tabs,
  TreeSelect,
  message,
  useForm,
} from 'wakii-ui-kit';

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

interface SettingsValues {
  siteName: string;
  retentionDays: number;
  darkByDefault: boolean;
  region: string;
  digest: string;
}

const settingsSchema = z.object({
  siteName: z.string().min(2, 'Tên site tối thiểu 2 ký tự'),
  retentionDays: z.number().min(1, 'Tối thiểu 1 ngày').max(365, 'Tối đa 365 ngày'),
  darkByDefault: z.boolean(),
  region: z.string().min(1, 'Chọn vùng dữ liệu'),
  digest: z.string(),
});

export function Settings() {
  const [tab, setTab] = useState('general');
  const form = useForm<SettingsValues>({
    schema: settingsSchema,
    initialValues: { siteName: 'Wakii Admin', retentionDays: 30, darkByDefault: false, region: '', digest: 'daily' },
  });

  const save = form.handleSubmit((values) => {
    message.success(`Đã lưu cài đặt — ${values.siteName} (demo)`);
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="m-0 text-h1 font-semibold text-ink">Cài đặt</h1>
        <p className="mt-1 mb-0 text-body text-ink3">Cấu hình workspace — lưu vào localStorage (demo).</p>
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'general',
            label: 'Chung',
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
                    aria-invalid={!!form.errors.siteName}
                    aria-describedby={form.errors.siteName ? 'set-site-name-error' : undefined}
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
                <Field label="Dark mode mặc định" htmlFor="set-dark" hint="Người dùng vẫn toggle được ở header">
                  <div id="set-dark" className="py-1">
                    <Switch
                      checked={form.values.darkByDefault}
                      onChange={(checked) => form.setValue('darkByDefault', checked)}
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

      <div>
        <Button type="primary" onClick={() => save()}>
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}
