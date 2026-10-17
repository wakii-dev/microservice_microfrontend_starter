// Async boundary bắt buộc cho MF shared non-eager — entry KHÔNG được import shared dep tĩnh
// (lỗi RUNTIME-006 loadShareSync nếu vi phạm — spike learned 2026-10-12)
import('./bootstrap.jsx');
