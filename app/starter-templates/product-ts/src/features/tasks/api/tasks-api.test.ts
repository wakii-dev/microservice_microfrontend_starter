// api test mẫu — msw node chặn fetch thật (dùng lại handlers của app) + assert
// zod parse ở ranh giới api. Đây là tầng DUY NHẤT cần network-mock: hooks/ui
// test mock module hoặc truyền props.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { z } from 'zod';
import { handlers } from '@/mocks/handlers';
import { tasksApi } from './tasks-api';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('tasksApi', () => {
  it('list → msw handler trả seed + zod parse thành Task[]', async () => {
    const tasks = await tasksApi.list();
    expect(tasks.length).toBeGreaterThanOrEqual(3);
    expect(tasks[0]).toMatchObject({ status: expect.stringMatching(/^(todo|doing|done)$/) });
    expect(typeof tasks[0].id).toBe('number');
  });

  it('create → POST + parse response 201', async () => {
    const created = await tasksApi.create({ title: 'Task từ test' });
    expect(created.id).toBeGreaterThan(3);
    expect(created.title).toBe('Task từ test');
    expect(created.status).toBe('todo');
  });

  it('toggleStatus → PATCH đổi status theo chu kỳ', async () => {
    const tasks = await tasksApi.list();
    const doing = tasks.find((t) => t.status === 'doing')!;
    const toggled = await tasksApi.toggleStatus(doing);
    expect(toggled.status).toBe('done');
  });

  it('response SAI shape → zod chặn ở ranh giới api (không lan vào UI)', async () => {
    server.use(
      http.get('*/tasks', () => HttpResponse.json([{ id: 'khong-phai-so', title: 42 }])),
    );
    await expect(tasksApi.list()).rejects.toBeInstanceOf(z.ZodError);
  });

  it('lỗi server → ApiError với message từ envelope', async () => {
    server.use(http.get('*/tasks', () => HttpResponse.json({ message: 'CSDL cháy.' }, { status: 500 })));
    await expect(tasksApi.list()).rejects.toThrow('CSDL cháy.');
  });
});
