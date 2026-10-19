// Tests useFieldArray — antd Form.List / RHF useFieldArray parity: append/remove/
// move/swap/update, remap errors theo path khi index dịch, focus-first-invalid
// vẫn hoạt động qua nameAt, out-of-range no-op.
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { useForm } from './useForm.js';
import { useFieldArray } from './useFieldArray.js';

afterEach(cleanup);

const schema = z.object({
  title: z.string().min(1),
  emails: z.array(
    z.object({ email: z.string().email('Email không hợp lệ'), label: z.string().optional() }),
  ),
});
type Form = z.infer<typeof schema>;
type EmailRow = Form['emails'][number];

function setup(initial?: Partial<Form>) {
  return renderHook(() => {
    const form = useForm<Form>({ schema, initialValues: initial });
    const arr = useFieldArray<Form, 'emails', EmailRow>(form, 'emails');
    return { form, arr };
  });
}

const THREE = { title: 'T', emails: [{ email: 'a@x.vn' }, { email: 'b@x.vn' }, { email: 'c@x.vn' }] };

describe('useFieldArray', () => {
  it('khởi tạo fields từ initialValues của form (path get)', () => {
    const { result } = setup({ title: 'T', emails: [{ email: 'a@x.vn' }, { email: 'b@x.vn' }] });
    expect(result.current.arr.count).toBe(2);
    expect(result.current.arr.fields[0]?.email).toBe('a@x.vn');
    expect(result.current.arr.fields[1]?.email).toBe('b@x.vn');
  });

  it('append → row cuối là default mới, đồng bộ form.values', () => {
    const { result } = setup(THREE);
    act(() => result.current.arr.append({ email: 'd@x.vn' }));
    expect(result.current.arr.count).toBe(4);
    expect(result.current.arr.fields[3]?.email).toBe('d@x.vn');
    expect(result.current.form.values.emails[3]?.email).toBe('d@x.vn');
  });

  it('remove row GIỮA → giá trị đúng index sau khi dồn (không lệch row)', () => {
    const { result } = setup(THREE);
    act(() => result.current.arr.remove(1)); // xoá b
    expect(result.current.arr.fields.map((f) => f.email)).toEqual(['a@x.vn', 'c@x.vn']);
  });

  it('move(0,2) insert-at: [a,b,c] → [b,c,a]', () => {
    const { result } = setup(THREE);
    act(() => result.current.arr.move(0, 2));
    expect(result.current.arr.fields.map((f) => f.email)).toEqual(['b@x.vn', 'c@x.vn', 'a@x.vn']);
  });

  it('swap(0,2): [a,b,c] → [c,b,a]', () => {
    const { result } = setup(THREE);
    act(() => result.current.arr.swap(0, 2));
    expect(result.current.arr.fields.map((f) => f.email)).toEqual(['c@x.vn', 'b@x.vn', 'a@x.vn']);
  });

  it('update(i, patch) merge — field khác của row giữ nguyên (path set)', () => {
    const rows = [{ email: 'a@x.vn', label: 'Work' }, { email: 'b@x.vn' }];
    const { result } = setup({ title: 'T', emails: rows });
    act(() => result.current.arr.update(0, { email: 'new@x.vn' }));
    expect(result.current.arr.fields[0]).toEqual({ email: 'new@x.vn', label: 'Work' });
    expect(result.current.arr.fields[1]?.email).toBe('b@x.vn');
  });

  it('index ngoài range → no-op an toàn (remove/move/swap)', () => {
    const { result } = setup(THREE);
    act(() => {
      result.current.arr.remove(9);
      result.current.arr.move(-1, 0);
      result.current.arr.swap(0, 5);
    });
    expect(result.current.arr.count).toBe(3);
    expect(result.current.arr.fields.map((f) => f.email)).toEqual(['a@x.vn', 'b@x.vn', 'c@x.vn']);
  });

  it('submit sai → errors theo path lồng "emails.<i>.email"', () => {
    const { result } = setup({ title: 'T', emails: [{ email: 'ok@x.vn' }, { email: 'bad' }] });
    act(() => result.current.form.handleSubmit(vi.fn())());
    expect(result.current.form.errors['emails.1.email']).toBe('Email không hợp lệ');
    expect(result.current.form.errors['emails.0.email']).toBeUndefined();
  });

  it('remap errors khi xoá row GIỮA — lỗi dồn về path index mới', () => {
    const { result } = setup({
      title: 'T',
      emails: [{ email: 'ok@x.vn' }, { email: 'bad1' }, { email: 'ok2@x.vn' }, { email: 'bad2' }],
    });
    act(() => result.current.form.handleSubmit(vi.fn())());
    expect(result.current.form.errors['emails.1.email']).toBeDefined();
    expect(result.current.form.errors['emails.3.email']).toBeDefined();

    act(() => result.current.arr.remove(0)); // bad1: 1→0, bad2: 3→2
    expect(result.current.form.errors['emails.0.email']).toBe('Email không hợp lệ');
    expect(result.current.form.errors['emails.2.email']).toBe('Email không hợp lệ');
    expect(result.current.form.errors['emails.3.email']).toBeUndefined();
  });

  it('remap errors khi move — lỗi đi theo row (không theo index)', () => {
    const { result } = setup({ title: 'T', emails: [{ email: 'bad' }, { email: 'ok@x.vn' }] });
    act(() => result.current.form.handleSubmit(vi.fn())());
    expect(result.current.form.errors['emails.0.email']).toBeDefined();

    act(() => result.current.arr.move(0, 1)); // row sai xuống cuối
    expect(result.current.form.errors['emails.0.email']).toBeUndefined();
    expect(result.current.form.errors['emails.1.email']).toBe('Email không hợp lệ');
  });

  it('append khi errors đang có → errors rebuild từ snapshot gồm row mới', () => {
    const { result } = setup({ title: 'T', emails: [{ email: 'bad' }] });
    act(() => result.current.form.handleSubmit(vi.fn())());
    expect(result.current.form.errors['emails.0.email']).toBeDefined();

    act(() => result.current.arr.append({ email: 'also-bad' }));
    expect(result.current.form.errors['emails.0.email']).toBe('Email không hợp lệ');
    expect(result.current.form.errors['emails.1.email']).toBe('Email không hợp lệ');
  });

  it('nameAt → "emails.<i>.<key>"; focus-first-invalid của form vẫn hoạt động', () => {
    const onValid = vi.fn();
    function Demo() {
      const form = useForm<Form>({
        schema,
        initialValues: { title: 'T', emails: [{ email: 'ok@x.vn' }, { email: 'bad' }] },
      });
      const arr = useFieldArray<Form, 'emails', EmailRow>(form, 'emails');
      return (
        <form onSubmit={form.handleSubmit(onValid)}>
          <input name="title" aria-label="title" value={form.values.title} onChange={form.handleChange('title')} />
          {arr.fields.map((f, i) => (
            <input
              key={i}
              name={arr.nameAt(i, 'email')}
              aria-label={`email-${i}`}
              value={f.email}
              onChange={(e) => arr.update(i, { email: e.target.value })}
            />
          ))}
          <button type="submit">Submit</button>
        </form>
      );
    }
    render(<Demo />);
    expect(screen.getByLabelText('email-1')).toHaveAttribute('name', 'emails.1.email');
    fireEvent.click(screen.getByText('Submit'));
    expect(onValid).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByLabelText('email-1')); // focus đúng input lỗi
    // sửa đúng → submit qua
    fireEvent.change(screen.getByLabelText('email-1'), { target: { value: 'fixed@x.vn' } });
    fireEvent.click(screen.getByText('Submit'));
    expect(onValid).toHaveBeenCalledTimes(1);
  });
});
