// handlers — CRUD giả cho /tasks (msw v3). Path dùng wildcard `*/tasks` để
// khớp CẢ fetch relative (dev không có VITE_API_URL — origin là vite server)
// lẫn absolute khi nối backend thật qua env.
import { delay, http, HttpResponse } from 'msw';
import { insertTask, tasksDb, type TaskRow } from './tasks.db';

const TASKS_PATTERN = '*/tasks';

export const handlers = [
  http.get(TASKS_PATTERN, async () => {
    await delay(150); // mô phỏng độ trễ mạng thật — để skeleton/loading có vai diễn
    return HttpResponse.json(tasksDb);
  }),

  http.post(TASKS_PATTERN, async ({ request }) => {
    const body = (await request.json()) as Partial<Pick<TaskRow, 'title' | 'status' | 'assignee'>>;
    if (!body.title) {
      return HttpResponse.json({ message: 'Thiếu tiêu đề task.' }, { status: 422 });
    }
    const created = insertTask({ title: body.title, status: body.status ?? 'todo', assignee: body.assignee ?? null });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`${TASKS_PATTERN}/:id`, async ({ request, params }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<Pick<TaskRow, 'status'>>;
    const task = tasksDb.find((t) => t.id === id);
    if (!task) return HttpResponse.json({ message: `Không thấy task #${id}.` }, { status: 404 });
    if (body.status) task.status = body.status;
    return HttpResponse.json(task);
  }),

  http.delete(`${TASKS_PATTERN}/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = tasksDb.findIndex((t) => t.id === id);
    if (index === -1) return HttpResponse.json({ message: `Không thấy task #${id}.` }, { status: 404 });
    tasksDb.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
