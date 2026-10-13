// repo.ts — repository interface: route layer phụ thuộc interface này, KHÔNG
// phụ thuộc drizzle trực tiếp → unit test inject in-memory fake (không postgres
// local), CI boot-smoke bấm DrizzleTaskRepo thật (đó là chỗ SQL được verify).
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  createdBy: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string;
}

export interface ListFilter {
  status?: TaskStatus;
  assigneeId?: string;
  limit: number; // 1..100
  offset: number; // >=0
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  createdBy: string;
}

export interface TaskPatch {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assigneeId?: string | null;
}

export interface TaskRepo {
  ping(): Promise<void>; // readyz — SELECT 1 thật
  list(filter: ListFilter): Promise<{ items: Task[]; total: number }>;
  getById(id: string): Promise<Task | null>;
  create(input: TaskCreate): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task | null>;
  remove(id: string): Promise<boolean>;
}
