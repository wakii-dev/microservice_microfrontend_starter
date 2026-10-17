// Helpers thời gian feed activity (SF-4, story VU-53) — pure, `now` tiêm vào để test
// trực tiếp không cần fake timers. vi-VN hardcode (epic out-of-scope i18n framework).

/** Giờ hiển thị địa phương vi-VN (giữ nguyên hành vi hiện có — spec slice mục 2) */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

/** Key nhóm ngày theo giờ LOCAL (đọc theo giờ người dùng — hand-off §4 timeline theo ngày) */
export function dayKey(iso: string): string {
  return dayKeyOf(new Date(iso));
}

function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Heading nhóm ngày: "Hôm nay" / "Hôm qua" / ngày đầy đủ vi-VN (vd "12 tháng 10, 2026") */
export function formatDayHeading(iso: string, now: Date): string {
  const d = new Date(iso);
  if (dayKeyOf(d) === dayKeyOf(now)) {
    return 'Hôm nay';
  }
  if (dayKeyOf(d) === dayKeyOf(new Date(now.getTime() - DAY_MS))) {
    return 'Hôm qua';
  }
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}
