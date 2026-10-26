// Home (bản ADMIN — đè src/routes/home.tsx): Dashboard qua feature cổng index.
// Layout chrome (Sidebar + Header) do AdminLayout bọc ngoài — xem router.tsx.
import { DashboardContainer } from '@/features/dashboard';
import { PageHeader } from '@/shared/ui/PageHeader';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Tổng quan hệ thống — KPI, hoạt động gần đây. Data demo tĩnh trong DashboardContainer; nối API thật bằng useQuery (xem feature tasks làm mẫu)."
      />
      <DashboardContainer />
    </div>
  );
}
