// env test — hợp đồng module môi trường: (1) export `env` dùng được với env mặc
// định (không set gì), (2) giá trị SAI định dạng → module fail nhanh lúc import
// với message rõ (đúng thiết kế "chốt zod tại khởi động" trong src/env.ts).
// resetModules + stubEnv để evaluate lại module với env giả trong test 2.
import { describe, expect, it, vi } from 'vitest';

describe('env', () => {
  it('export env — schema parse pass khi không set biến nào', async () => {
    const { env } = await import('./env');
    expect(env).toBeTypeOf('object');
    expect(env.VITE_API_URL).toBeUndefined(); // optional — không set cũng hợp lệ
  });

  it('VITE_API_URL sai định dạng → import bị chặn với message rõ ràng', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_URL', 'khong-phai-url');
    await expect(import('./env')).rejects.toThrow('Biến môi trường sai định dạng');
    vi.unstubAllEnvs();
  });
});
