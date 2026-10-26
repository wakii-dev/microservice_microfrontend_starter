// 404 — Result component của kit (status 404) + nút về trang chủ.
import { Link, Result } from '@wakii/ui-kit';

export default function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Không tìm thấy trang"
      subTitle="Đường dẫn không tồn tại hoặc đã bị di chuyển."
      extra={
        <Link href="/">
          ← Về trang chủ
        </Link>
      }
    />
  );
}
