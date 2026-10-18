// useForm — native form state + zod validation (peer-dep: consumer tự cài zod
// khi dùng hook này — ui-kit chỉ khai báo peer). API tối giản kiểu RHF:
// values/errors/touched + setValue/handleChange/handleBlur/handleSubmit/reset/isValid.
// errors: Record<path, message> map từ safeParse issues — path join '.', giữ
// issue ĐẦU TIÊN mỗi field. handleSubmit: sai → set errors + focus field đầu
// (querySelector [name=...]); đúng → onSubmit(parsed — schema transformers đã chạy).
// mode: 'onSubmit' (mặc định) | 'onBlur' (validate từng field khi rời input)
// | 'onChange' (validate từng field khi gõ — lỗi tự xoá khi sửa đúng).
import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { ZodType } from 'zod';

export type FormValidationMode = 'onSubmit' | 'onBlur' | 'onChange';

export interface UseFormOptions<T> {
  schema: ZodType<T>;
  initialValues?: Partial<T>;
  mode?: FormValidationMode;
}

export type FormErrors = Record<string, string>;

type SafeResult<T> = ReturnType<ZodType<T>['safeParse']>;

/** safeParse issues → FormErrors: path join '.', 1 message/field (issue đầu). */
function collectErrors<T>(result: Extract<SafeResult<T>, { success: false }>): FormErrors {
  const next: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'root';
    if (!(key in next)) next[key] = issue.message;
  }
  return next;
}

export function useForm<T>({ schema, initialValues, mode = 'onSubmit' }: UseFormOptions<T>) {
  /* Shallow-copy chỉ khi object (tránh spread primitive → biến thành {0:..,1:..}). */
  const cloneInit = (v?: Partial<T>): T => {
    const base = (v ?? initialValues) as T | undefined;
    if (base === undefined) return {} as T;
    return typeof base === 'object' && base !== null ? ({ ...base } as T) : base;
  };

  const [values, setValues] = useState<T>(() => cloneInit());
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isValid = useMemo(() => schema.safeParse(values).success, [schema, values]);

  /** Validate 1 field trên snapshot values cụ thể — merge: xoá lỗi cũ field, thêm nếu vẫn sai. */
  const validateFieldWith = (field: string, vals: T) => {
    const result = schema.safeParse(vals);
    const all = result.success ? {} : collectErrors<T>(result);
    setErrors((prev) => {
      const rest = { ...prev };
      delete rest[field];
      return all[field] !== undefined ? { ...rest, [field]: all[field] } : rest;
    });
  };

  const setValue = <K extends keyof T & string>(field: K, value: T[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (mode === 'onChange') validateFieldWith(field, next);
  };

  /** Handler cho onChange của input — bind field, đọc e.target.value. */
  const handleChange = <K extends keyof T & string>(field: K) => {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValue(field, e.target.value as T[K]);
    };
  };

  /** Handler cho onBlur — đánh touched + validate field theo mode onBlur. */
  const handleBlur = <K extends keyof T & string>(field: K) => {
    return () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      if (mode === 'onBlur') validateFieldWith(field, values);
    };
  };

  /** Submit — sai: set errors + đánh touched toàn bộ + focus field đầu; đúng: onValid(parsed). */
  const handleSubmit = (onValid: (data: T) => void | Promise<void>) => {
    return (e?: FormEvent) => {
      e?.preventDefault();
      const result = schema.safeParse(values);
      if (result.success) {
        setErrors({});
        void onValid(result.data);
        return;
      }
      setErrors(collectErrors<T>(result));
      setTouched((prev) => {
        const all = { ...prev };
        for (const key of Object.keys(values as Record<string, unknown>)) all[key] = true;
        return all;
      });
      const first = result.error.issues[0];
      const firstPath = first?.path.join('.') ?? '';
      if (firstPath) document.querySelector<HTMLElement>(`[name="${firstPath}"]`)?.focus();
    };
  };

  /** Reset về initialValues (hoặc next truyền vào) + xoá errors/touched. */
  const reset = (next?: Partial<T>) => {
    setValues(cloneInit(next));
    setErrors({});
    setTouched({});
  };

  return { values, errors, touched, setValue, handleChange, handleBlur, handleSubmit, reset, isValid };
}
