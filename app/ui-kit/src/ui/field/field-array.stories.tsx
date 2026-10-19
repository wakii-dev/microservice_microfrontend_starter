// Field Array stories — useForm + useFieldArray (antd Form.List parity).
// Matrix: add/remove cơ bản · validation theo path lồng · reorder (move/swap).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { z } from 'zod';
import { Button, Field, Input, Icon, useForm, useFieldArray } from '../../index';

const meta = {
  title: 'Forms/Field Array',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

const listSchema = z.object({
  emails: z.array(
    z.object({ email: z.string().email('Email không hợp lệ'), label: z.string().optional() }),
  ).min(1, 'Cần ít nhất 1 email'),
});
type ListForm = z.infer<typeof listSchema>;
type EmailRow = ListForm['emails'][number];

/** DynamicEmails — add/remove rows; mỗi ô bind qua update(i, patch) + nameAt. */
export const DynamicEmails: Story = {
  render: () => <EmailsDemo />,
};

function EmailsDemo() {
  const form = useForm<ListForm>({
    schema: listSchema,
    initialValues: { emails: [{ email: 'alice@demo.local' }] },
  });
  const arr = useFieldArray<ListForm, 'emails', EmailRow>(form, 'emails');

  return (
    <div className="w-96">
      <div className="grid gap-2">
        {arr.fields.map((row, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label={i === 0 ? 'Email' : undefined} htmlFor={`email-${i}`} className="flex-1"
              error={form.errors[`emails.${i}.email`]}>
              <Input
                id={`email-${i}`}
                name={arr.nameAt(i, 'email')}
                placeholder="name@company.vn"
                value={row.email}
                invalid={!!form.errors[`emails.${i}.email`]}
                onChange={(e) => arr.update(i, { email: e.target.value })}
              />
            </Field>
            <Button type="text" icon={<Icon name="times" size={14} />} aria-label={`Xoá email ${i + 1}`}
              onClick={() => arr.remove(i)} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button type="default" icon={<Icon name="plus" size={14} />}
          onClick={() => arr.append({ email: '' })}>
          Thêm email
        </Button>
        <span className="text-label text-ink3">{arr.count} row</span>
      </div>
    </div>
  );
}

/** WithValidation — zod validate path lồng `emails.<i>.email`; submit sai focus đúng ô. */
export const WithValidation: Story = {
  render: () => <EmailsValidationDemo />,
};

function EmailsValidationDemo() {
  const [saved, setSaved] = useState<string | null>(null);
  const form = useForm<ListForm>({
    schema: listSchema,
    mode: 'onChange',
    initialValues: { emails: [{ email: 'ok@demo.local' }, { email: 'sai-email' }] },
  });
  const arr = useFieldArray<ListForm, 'emails', EmailRow>(form, 'emails');

  return (
    <form className="w-96" onSubmit={form.handleSubmit((d) => setSaved(d.emails.map((r) => r.email).join(', ')))}>
      <div className="grid gap-2">
        {arr.fields.map((row, i) => (
          <Field key={i} label={`Email ${i + 1}`} htmlFor={`v-email-${i}`}
            error={form.errors[`emails.${i}.email`]}>
            <Input
              id={`v-email-${i}`}
              name={arr.nameAt(i, 'email')}
              value={row.email}
              invalid={!!form.errors[`emails.${i}.email`]}
              onChange={(e) => arr.update(i, { email: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button htmlType="submit" type="primary">Lưu</Button>
        <Button type="text" icon={<Icon name="plus" size={14} />} onClick={() => arr.append({ email: '' })}>
          Thêm
        </Button>
      </div>
      {saved && <p className="mt-2 text-label text-st-done">Đã lưu: {saved}</p>}
      {form.isValid === false && <p className="mt-1 text-label text-ink3">Form chưa hợp lệ — sửa ô đỏ rồi Lưu lại.</p>}
    </form>
  );
}

/** WithReorder — nút ↑↓ dùng move(from, to); lỗi đi THEO ROW, không theo index. */
export const WithReorder: Story = {
  render: () => <EmailsReorderDemo />,
};

function EmailsReorderDemo() {
  const form = useForm<ListForm>({
    schema: listSchema,
    initialValues: { emails: [{ email: 'primary@demo.local', label: 'Chính' }, { email: 'backup@demo.local', label: 'Dự phòng' }] },
  });
  const arr = useFieldArray<ListForm, 'emails', EmailRow>(form, 'emails');
  const last = arr.count - 1;

  return (
    <div className="w-96">
      <div className="grid gap-2">
        {arr.fields.map((row, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-line bg-s2 px-2 py-1.5">
            <span className="w-8 text-label text-ink3">{i + 1}.</span>
            <input
              className="min-w-0 flex-1 border-none bg-transparent text-body text-ink outline-none"
              name={arr.nameAt(i, 'email')}
              value={row.email}
              onChange={(e) => arr.update(i, { email: e.target.value })}
            />
            <span className="text-label text-ink3">{row.label}</span>
            <Button type="text" size="small" aria-label={`Đưa email ${i + 1} lên`}
              disabled={i === 0} onClick={() => arr.move(i, i - 1)}>
              <Icon name="arrow-up" size={12} />
            </Button>
            <Button type="text" size="small" aria-label={`Đưa email ${i + 1} xuống`}
              disabled={i === last} onClick={() => arr.move(i, i + 1)}>
              <Icon name="arrow-down" size={12} />
            </Button>
            <Button type="text" size="small" aria-label={`Xoá email ${i + 1}`} onClick={() => arr.remove(i)}>
              <Icon name="times" size={12} />
            </Button>
          </div>
        ))}
      </div>
      <Button className="mt-2" type="default" icon={<Icon name="plus" size={14} />}
        onClick={() => arr.append({ email: '' })}>
        Thêm email
      </Button>
    </div>
  );
}

/** LiveDemo — add/remove/move with a live JSON view of form.values; watch errors follow rows. */
export const LiveDemo: Story = {
  render: () => <LiveArrayDemo />,
};

function LiveArrayDemo() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const form = useForm<ListForm>({
    schema: listSchema,
    mode: 'onChange',
    initialValues: { emails: [{ email: 'alpha@demo.local' }, { email: 'broken' }, { email: 'gamma@demo.local' }] },
  });
  const arr = useFieldArray<ListForm, 'emails', EmailRow>(form, 'emails');

  return (
    <div className="flex gap-6">
      <form className="w-96" onSubmit={form.handleSubmit((d) => setSubmitted(d.emails.map((r) => r.email).join(', ')))}>
        <div className="grid gap-2">
          {arr.fields.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Field htmlFor={`live-${i}`} className="flex-1" error={form.errors[`emails.${i}.email`]}>
                <Input
                  id={`live-${i}`}
                  name={arr.nameAt(i, 'email')}
                  placeholder={`Email ${i + 1}`}
                  value={row.email}
                  invalid={!!form.errors[`emails.${i}.email`]}
                  onChange={(e) => arr.update(i, { email: e.target.value })}
                />
              </Field>
              <Button type="text" size="small" aria-label={`Move email ${i + 1} up`}
                disabled={i === 0} onClick={() => arr.move(i, i - 1)}>
                <Icon name="arrow-up" size={12} />
              </Button>
              <Button type="text" size="small" aria-label={`Remove email ${i + 1}`} onClick={() => arr.remove(i)}>
                <Icon name="times" size={12} />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button type="default" icon={<Icon name="plus" size={14} />} onClick={() => arr.append({ email: '' })}>
            Add
          </Button>
          <Button type="text" disabled={arr.count < 2} onClick={() => arr.swap(0, arr.count - 1)}>
            Swap first–last
          </Button>
          <Button htmlType="submit" type="primary">Submit</Button>
        </div>
        {submitted && <p className="mt-2 text-label text-st-done">Submitted: {submitted}</p>}
      </form>
      <pre className="max-h-72 w-72 overflow-auto rounded-xl border border-line bg-s2 p-3 text-meta text-ink2">
        {JSON.stringify({ count: arr.count, values: form.values.emails, errors: form.errors }, null, 2)}
      </pre>
    </div>
  );
}
