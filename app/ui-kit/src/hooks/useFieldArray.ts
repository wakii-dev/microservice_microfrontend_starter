// useFieldArray — mảng động trong useForm (antd Form.List / RHF useFieldArray parity,
// docs/parity-matrix.md Gap P0 "Form.List giá trị cao"). Path get/set dạng
// `name.index.key`: get qua `fields[i]`, set qua `update(i, patch)`; input đặt
// name qua `nameAt(i, key)` → focus-first-invalid của form.handleSubmit tự hoạt
// động (querySelector `[name="emails.0.email"]`).
// Sau MỖI op cấu trúc (append/remove/move/swap/update): nếu form ĐANG có errors,
// rebuild toàn bộ errors từ snapshot values MỚI qua schema — lỗi tự dồn path đúng
// khi row giữa bị xoá/dời (index dịch). Form sạch (chưa submit) không bị hiện
// lỗi sớm. Mode 'onChange' của form vẫn validate riêng như cũ (vô hại với path con).
// Lưu ý: 1 op mỗi event — op đọc `form.values` từ render hiện tại (hook thuần,
// closure-based như useForm; gọi 2 op liên tiếp trong 1 handler → op sau thấy
// state cũ, hãy gộp thành 1 op hoặc tách 2 event).
import { collectErrors, type FormInstance } from './useForm.js';

export interface FieldArrayHelpers<R extends object> {
  /** Snapshot các row hiện tại — render `.map()`. */
  fields: R[];
  /** Số row hiện tại. */
  count: number;
  /** Push 1 row — giá trị mặc định do consumer cung cấp (antd Form.List add). */
  append: (row: R) => void;
  /** Xoá row theo index — errors dồn về path đúng sau khi index dịch. */
  remove: (index: number) => void;
  /** Chuyển row `from` tới vị trí `to` (insert-at, RHF semantics). */
  move: (from: number, to: number) => void;
  /** Đổi chỗ 2 row. */
  swap: (a: number, b: number) => void;
  /** Thay nội dung row i (shallow-merge patch) — set từng ô `name.i.key`. */
  update: (index: number, patch: Partial<R>) => void;
  /** name attribute cho input `key` của row i — khớp focus-first-invalid của form. */
  nameAt: (index: number, key: keyof R & string) => string;
}

// R (kiểu row) truyền tường minh ở call site: useFieldArray<Form, 'emails', EmailRow>(...)
// — TS check generic default eagerly nên không infer-conditional được cho constraint object.
export function useFieldArray<F extends object, K extends keyof F & string, R extends object>(
  form: FormInstance<F>,
  name: K,
): FieldArrayHelpers<R> {
  const rows = ((form.values[name] as unknown) ?? []) as R[];
  type Row = R;

  /** Ghi mảng mới vào form + remap errors (khi đã có) từ snapshot mới. */
  function apply(nextRows: Row[]) {
    form.setValue(name, nextRows as F[K]);
    if (Object.keys(form.errors).length > 0) {
      const snapshot = { ...form.values, [name]: nextRows } as F;
      const result = form.schema.safeParse(snapshot);
      form.setErrors(result.success ? {} : collectErrors(result));
    }
  }

  function append(row: Row) {
    apply([...rows, row]);
  }

  function remove(index: number) {
    if (index < 0 || index >= rows.length) return;
    apply(rows.filter((_, i) => i !== index));
  }

  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    apply(next);
  }

  function swap(a: number, b: number) {
    if (a === b || a < 0 || b < 0 || a >= rows.length || b >= rows.length) return;
    const next = [...rows];
    [next[a], next[b]] = [next[b]!, next[a]!];
    apply(next);
  }

  function update(index: number, patch: Partial<Row>) {
    if (index < 0 || index >= rows.length) return;
    apply(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  const nameAt = (index: number, key: keyof Row & string) => `${name}.${index}.${key}`;

  return { fields: rows, count: rows.length, append, remove, move, swap, update, nameAt };
}
