// schema — hợp đồng form login (zod = source of truth cho useForm).
import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().min(1, 'Email bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu cần 8–72 ký tự.').max(72, 'Mật khẩu cần 8–72 ký tự.'),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;
