// repo.ts — repository interface: route layer phụ thuộc interface này, KHÔNG
// phụ thuộc drizzle trực tiếp → unit test inject in-memory fake (không postgres
// local), CI boot-smoke bấm DrizzleTaskRepo thật (đó là chỗ SQL được verify).
//
// SF-2 (FI-79) — transactional outbox (ADR-0008, conventions/09 rule 2): mọi
// mutation nhận outbox op (`events`) và ghi task + outbox trong CÙNG 1 tx.
// Envelope `id` (UUIDv4) + `occurredAt` do REPO sinh từng event (task-events.md:
// producer sinh MỖI event — consumer dùng id làm khóa idempotency, KHÔNG taskId).
// Route build `events` theo event matrix PRESENCE-BASED (body có gì bắn nấy —
// ADR-0008 ghi value-compare là path production, KHÔNG value-compare ở đây).
export type TaskStatus = 'todo' | 'in_progress' | 'done';
// READ-ONLY mở rộng: `assignment_failed` chỉ compensation consumer ghi — PATCH
// body không nhận (tasks.yaml: TaskStatus writable 3 / TaskStatusExtended 4).
export type TaskStatusExtended = TaskStatus | 'assignment_failed';

export type TaskEventType = 'task.created' | 'task.updated' | 'task.assigned' | 'task.deleted';

/** Outbox op do route build — envelope id/occurredAt do repo điền lúc ghi. */
export interface OutboxEventInput {
  type: TaskEventType;
  payload: Record<string, unknown>;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatusExtended;
  assigneeId: string | null;
  createdBy: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string;
}

export interface ListFilter {
  status?: TaskStatus; // query param — writable 3 giá trị (tasks.yaml)
  assigneeId?: string;
  /** Search tiêu đề (query param `q`) — route đã trim (rỗng → không truyền).
   *  Repo escape ký tự LIKE `%_\` rồi ILIKE %q% — khớp literal, case-insensitive. */
  q?: string;
  limit: number; // 1..100
  offset: number; // >=0
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  createdBy: string;
  /** Route sinh TRƯỚC khi create (payload event cần taskId cùng tx). Repo tự
   *  sinh nếu bỏ qua — DDL: id app-generated uuid v4, không gen_random_uuid. */
  id?: string;
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
  /** mutation + INSERT outbox trong CÙNG 1 tx — events rỗng = không bắn event. */
  create(input: TaskCreate, events: OutboxEventInput[]): Promise<Task>;
  update(id: string, patch: TaskPatch, events: OutboxEventInput[]): Promise<Task | null>;
  remove(id: string, events: OutboxEventInput[]): Promise<boolean>;
  /**
   * Compensation consumer (saga — ADR-0008): conditional UPDATE chống stale
   * compensation — chỉ đổi khi assignee KHỚP event VÀ chưa ở trạng thái đích.
   * Trả true khi UPDATE khớp ≥1 row (idempotent: event lặp → lần 2 match 0).
   */
  markAssignmentFailed(taskId: string, assigneeId: string): Promise<boolean>;
}
