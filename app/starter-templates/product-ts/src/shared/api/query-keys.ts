// query-keys — factory key TanStack Query theo pattern TKDodo: khai báo 1 lần
// mỗi resource (`tasksKeys = createQueryKeys('tasks')`) rồi dùng
// `tasksKeys.list()` / `tasksKeys.detail(id)` — invalidate HỢP theo tiền tố
// (`tasksKeys.lists()` invalidates mọi list, không đụng detail).
export interface ResourceKeys {
  /** Gốc resource — invalidate toàn bộ những gì liên quan resource này. */
  readonly all: readonly string[];
  /** Tiền tố mọi query list — invalidate khi có mutation ảnh hưởng list. */
  readonly lists: () => readonly [string, 'list'];
  /** 1 list cụ thể theo filters — cache riêng per filter-set. */
  readonly list: (filters?: Record<string, unknown>) => readonly [string, 'list', Record<string, unknown>];
  /** Tiền tố mọi query detail. */
  readonly details: () => readonly [string, 'detail'];
  /** 1 detail theo id. */
  readonly detail: (id: string | number) => readonly [string, 'detail', string | number];
}

export function createQueryKeys(resource: string): ResourceKeys {
  return {
    all: [resource],
    lists: () => [resource, 'list'],
    list: (filters = {}) => [resource, 'list', filters],
    details: () => [resource, 'detail'],
    detail: (id) => [resource, 'detail', id],
  };
}
