// env — chốt biến môi trường bằng zod TẠI KHỞI ĐỘNG: sai → app fail nhanh với
// message rõ, thay vì `undefined` lan xa tới khi vỡ ở runtime. Thêm biến mới:
// khai báo 1 dòng trong schema (+'/.env*' ở máy bạn) rồi dùng `env.VITE_X`.
import { z } from 'zod';

const envSchema = z.object({
  /** Base URL API backend — optional: minimal preset chạy tốt không backend. */
  VITE_API_URL: z.url().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error(`Biến môi trường sai định dạng:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
