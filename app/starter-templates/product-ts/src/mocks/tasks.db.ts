// tasks.db — store GIẢ trong bộ nhớ cho MSW handlers (mô phỏng backend, reset
// mỗi lần reload trang). Data THÔ (không import schema của app — handler đóng
// vai server, client mới là bên parse/validate).
export interface TaskRow {
  id: number;
  title: string;
  status: 'todo' | 'doing' | 'done';
  assignee: string | null;
  createdAt: string;
}

let nextId = 4;

export const tasksDb: TaskRow[] = [
  { id: 1, title: 'Đọc AGENTS.md', status: 'done', assignee: 'alice', createdAt: '2026-01-10T08:00:00.000Z' },
  { id: 2, title: 'Thêm feature đầu tiên', status: 'doing', assignee: 'bob', createdAt: '2026-01-11T09:30:00.000Z' },
  { id: 3, title: 'Nối API thật (bỏ MSW)', status: 'todo', assignee: null, createdAt: '2026-01-12T14:00:00.000Z' },
];

export function insertTask(row: Omit<TaskRow, 'id' | 'createdAt'>): TaskRow {
  const task: TaskRow = { ...row, id: nextId++, createdAt: new Date().toISOString() };
  tasksDb.unshift(task);
  return task;
}
