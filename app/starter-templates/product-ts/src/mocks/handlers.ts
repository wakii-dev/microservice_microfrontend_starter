// handlers — CRUD giả cho /tasks (msw v3). Path dùng wildcard `*/tasks` để
// khớp CẢ fetch relative (dev không có VITE_API_URL — origin là vite server)
// lẫn absolute khi nối backend thật qua env.
import { delay, http, HttpResponse } from 'msw';
import { insertTask, tasksDb, type TaskRow } from './tasks.db';

const TASKS_PATTERN = '*/tasks';

export const handlers = [
  http.get(TASKS_PATTERN, async ({ request }) => {
    // 2 flag demo trên URL — rehearse UI trạng thái đặc biệt không cần đụng code:
    // ?empty=1 → list rỗng (xem EmptyState), ?boom=1 → 500 (xem Alert lỗi + Thử lại).
    const { searchParams } = new URL(request.url);
    if (searchParams.has('empty')) return HttpResponse.json([]);
    if (searchParams.has('boom')) {
      return HttpResponse.json({ message: 'Máy chủ bận (500 giả lập qua ?boom=1).' }, { status: 500 });
    }
    await delay(150); // mô phỏng độ trễ mạng thật — để skeleton/loading có vai diễn
    return HttpResponse.json(tasksDb);
  }),

  http.post(TASKS_PATTERN, async ({ request }) => {
    const body = (await request.json()) as Partial<Pick<TaskRow, 'title' | 'status' | 'assignee'>>;
    const title = body.title?.trim();
    if (!title) {
      return HttpResponse.json({ message: 'Thiếu tiêu đề task.' }, { status: 422 });
    }
    // Trùng tiêu đề (không phân biệt hoa/thường) → 409 — lỗi nghiệp vụ thật mà
    // UI phải xử lý duyên dáng (toast message từ envelope), không crash.
    const duplicate = tasksDb.some((task) => task.title.toLowerCase() === title.toLowerCase());
    if (duplicate) {
      return HttpResponse.json({ message: `Tiêu đề "${title}" đã tồn tại — chọn tên khác.` }, { status: 409 });
    }
    const created = insertTask({ title, status: body.status ?? 'todo', assignee: body.assignee ?? null });
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
