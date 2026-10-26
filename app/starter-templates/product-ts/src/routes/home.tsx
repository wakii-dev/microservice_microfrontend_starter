// Home — trang mẫu preset product: PageHeader + feature `tasks` qua CỔNG
// index (containers bơm data, UI render bảng + form). Route KHÔNG import lách
// vào containers/ui/hooks/api — eslint boundaries chặn.
import { TasksPageContainer, TaskFormContainer } from '@/features/tasks';
import { PageHeader } from '@/shared/ui/PageHeader';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tasks"
        description="Feature mẫu preset product — TanStack Query + zod + MSW, cấu trúc containers. Dev chạy với MSW mock (không cần backend); đặt VITE_API_URL để nối API thật."
      />
      <TaskFormContainer />
      <TasksPageContainer />
    </div>
  );
}
