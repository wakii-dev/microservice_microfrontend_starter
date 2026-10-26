// Tasks — trang CRUD demo data layer (TanStack Query + MSW) bọc trong layout
// admin. Feature import QUA index (eslint boundaries chặn lách).
import { TaskFormContainer, TasksPageContainer } from '@/features/tasks';
import { PageHeader } from '@/shared/ui/PageHeader';

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tasks"
        description="Feature mẫu data layer — TanStack Query + zod + MSW. Dev chạy với MSW mock; đặt VITE_API_URL để nối API thật."
      />
      <TaskFormContainer />
      <TasksPageContainer />
    </div>
  );
}
