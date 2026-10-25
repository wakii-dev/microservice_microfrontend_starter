// Tests Field — label/error/hint render + id nối aria-describedby đúng (spec batch ⑩ worker B).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Input } from '../input/index.js';
import { Field } from './index.js';

afterEach(cleanup);

describe('Field', () => {
  it('render label htmlFor + children — label nối được control', () => {
    render(
      <Field label="Tiêu đề" htmlFor="task-title">
        <Input id="task-title" />
      </Field>,
    );

    expect(screen.getByText('Tiêu đề')).toHaveAttribute('for', 'task-title');
    expect(screen.getByLabelText('Tiêu đề')).toBeInTheDocument(); // htmlFor ↔ id khớp
  });

  it('required → dấu * aria-hidden trên label', () => {
    render(
      <Field label="Email" htmlFor="f-email" required>
        <Input id="f-email" />
      </Field>,
    );

    const star = screen.getByText('*');
    expect(star).toHaveAttribute('aria-hidden', 'true');
  });

  it('error → p role=alert id {htmlFor}-error; nối describedby đúng; ưu tiên hơn hint', () => {
    render(
      <Field label="Email" htmlFor="f-email" error="Email không hợp lệ" hint="Dùng email công việc">
        <Input id="f-email" invalid aria-invalid aria-describedby="f-email-error" />
      </Field>,
    );

    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Email không hợp lệ');
    expect(error).toHaveAttribute('id', 'f-email-error');
    expect(screen.queryByText('Dùng email công việc')).toBeNull(); // error thay hint
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-describedby', 'f-email-error');
  });

  it('hint → p id {htmlFor}-hint khi không có error', () => {
    render(
      <Field label="Email" htmlFor="f-email" hint="Dùng email công việc">
        <Input id="f-email" aria-describedby="f-email-hint" />
      </Field>,
    );

    const hint = screen.getByText('Dùng email công việc');
    expect(hint).toHaveAttribute('id', 'f-email-hint');
    expect(hint).not.toHaveAttribute('role', 'alert');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-describedby', 'f-email-hint');
  });

  it('không htmlFor → error/hint render nhưng không có id', () => {
    render(
      <Field label="Ghi chú" error="Bắt buộc nhập">
        <Input />
      </Field>,
    );

    expect(screen.getByRole('alert')).not.toHaveAttribute('id');
  });
});
