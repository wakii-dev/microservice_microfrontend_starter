// Timesheet — bảng log giờ theo tuần (task management): hàng = task/dự án,
// cột = 7 ngày trong tuần, ô = số giờ; footer tổng theo cột + grand total
// (font-medium + tabular-nums chuẩn Statistic).
// Tuần LUÔN bắt đầu Thứ 2 (spec timesheet: "vi: T2, en: Mon") — khác Calendar
// (nôm theo firstDayOfWeek). Locale chỉ đổi NHÃN: vi/en qua date-picker/locale
// (prop thắng DateLocaleProvider context, default vi); nhãn nội bộ (nút tuần,
// tiêu đề cột, tổng) chọn theo identity VI_LOCALE — custom locale → nhãn en.
// Editable → InputNumber compact trong ô (min 0 max 24 step 0.5, clamp sẵn);
// ô null → trống. Cột cuối tuần (T7/CN — 2 cột CUỐI, mọi locale) nền bg-s3/60
// nhẹ phân biệt (spec nháp bg-s2/60 = tàng hình trên wrapper bg-s2 light —
// đổi token thấy được gần nhất, vẫn tokens-only).
// Đổi tuần → grid remount qua key=weekKey → replay animate bp-fade-in
// (motion-fast + ease-enter); InputNumber uncontrolled nhờ remount cũng tự
// đồng bộ text theo tuần mới.
// a11y: bảng thật table/thead/tbody/tfoot + th scope; aria-label ô
// "Thứ 2 20/10 · Task A"; focus-visible ring chuẩn rule 4 ở nút điều hướng.
// Sticky: cột label sticky-left + thead sticky-top khi overflow (z-10/z-20
// theo idiom Table — sticky in-flow, không thuộc overlay scale --z-*).
import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../icons/index.js';
import { InputNumber } from '../input-number/index.js';
import { Skeleton } from '../skeleton/index.js';
import { VI_LOCALE, useDateLocale, type DateLocaleInput } from '../date-picker/locale.js';

export interface TimesheetRow {
  /** Key ổn định của hàng — bắn lại trong onCellChange. */
  key: string;
  /** Tên task/dự án (cột label sticky-left). */
  label: ReactNode;
  /** Dòng phụ dưới label (vd dự án / người thực hiện). */
  meta?: ReactNode;
  /** 7 giá trị giờ theo cột ngày (null = trống) — tuần Thứ 2 → Chủ nhật. */
  values: Array<number | null>;
}

/** classNames sub-part slots (antd v5 style) — merge SAU default classes. */
export interface TimesheetClassNames {
  /** Khối ngoài (viền + nền + rounded). */
  wrapper?: string;
  /** thead. */
  header?: string;
  /** Mỗi tr thân bảng. */
  row?: string;
  /** Mỗi td ngày. */
  cell?: string;
  /** tfoot tổng. */
  footer?: string;
}

export interface TimesheetProps {
  rows: TimesheetRow[];
  /** Bất kỳ ngày nào trong tuần hiển thị; tuần chuẩn hóa về Thứ 2. */
  week: Date;
  /** Bắn kèm tuần mới (Date = Thứ 2 của tuần) khi bấm prev/next. */
  onWeekChange?: (weekStart: Date) => void;
  /** Ô thay đổi: (rowKey, dayIndex 0–6 Thứ2→CN, giá trị đã clamp | null khi xoá). */
  onCellChange?: (rowKey: string, dayIndex: number, value: number | null) => void;
  /** true → ô nhập InputNumber; false → text (mặc định). */
  editable?: boolean;
  /** 'vi' | 'en' | DateLocale — thắng DateLocaleProvider context; default vi. */
  locale?: DateLocaleInput;
  /** Skeleton thay thân bảng (header + khoảng tuần vẫn render). */
  loading?: boolean;
  classNames?: TimesheetClassNames;
  className?: string;
}

// Tuần bắt đầu Thứ 2: lùi về ngày thứ Hai của tuần chứa `date`.
function weekStartOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const sumVals = (vals: Array<number | null>): number => vals.reduce<number>((a, v) => a + (v ?? 0), 0);
// Tổng 0.5 có thể ra binary noise (0.1+0.2) — làm tròn 2 chữ số thập phân.
const fmtNum = (n: number): string => String(Math.round(n * 100) / 100);

// Tên ngày ĐỦ cho aria-label ô — xếp theo CỘT (Thứ 2 → Chủ nhật).
const FULL_DAYS_VI = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const FULL_DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const NAV_CLS =
  'flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-transparent text-ink transition-colors hover:bg-s3 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';

export function Timesheet({
  rows,
  week,
  onWeekChange,
  onCellChange,
  editable = false,
  locale,
  loading = false,
  classNames,
  className,
}: TimesheetProps) {
  const loc = useDateLocale(locale);
  const isVi = loc === VI_LOCALE;
  // Tuần hiển thị: state nội bộ (nav chủ động) + sync khi prop week đổi.
  const [weekStart, setWeekStart] = useState(() => weekStartOf(week));
  useEffect(() => {
    setWeekStart(weekStartOf(week));
  }, [week]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekEnd = days[6];
  const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;

  const nav = (delta: number) => {
    const next = weekStartOf(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + delta));
    setWeekStart(next);
    onWeekChange?.(next);
  };

  const str = isVi
    ? { prevWeek: 'Tuần trước', nextWeek: 'Tuần sau', task: 'Công việc', total: 'Tổng', grand: 'Tổng cộng' }
    : { prevWeek: 'Previous week', nextWeek: 'Next week', task: 'Task', total: 'Total', grand: 'Grand total' };

  // Nhãn ngắn thứ trong tuần — weekdays của locale xếp từ firstDayOfWeek của nó
  // (vi: T2 đầu / en: Su đầu) → quy đổi index qua chính firstDayOfWeek.
  const weekdayShort = (d: Date) => loc.weekdays[(d.getDay() - loc.firstDayOfWeek + 7) % 7];
  const fullDay = (col: number) => (isVi ? FULL_DAYS_VI[col] : FULL_DAYS_EN[col]);

  // Nhãn khoảng tuần: vi "19–25 Th10 2026" · en "Oct 19–25, 2026";
  // khác tháng: vi "26 Th10–1 Th11 2026" · en "Oct 26 – Nov 1, 2026".
  const shortMonth = (d: Date) => (isVi ? `Th${d.getMonth() + 1}` : loc.months[d.getMonth()].slice(0, 3));
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const weekLabel = isVi
    ? sameMonth
      ? `${weekStart.getDate()}–${weekEnd.getDate()} ${shortMonth(weekStart)} ${weekEnd.getFullYear()}`
      : `${weekStart.getDate()} ${shortMonth(weekStart)}–${weekEnd.getDate()} ${shortMonth(weekEnd)} ${weekEnd.getFullYear()}`
    : sameMonth
      ? `${shortMonth(weekStart)} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
      : `${shortMonth(weekStart)} ${weekStart.getDate()} – ${shortMonth(weekEnd)} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;

  const colTotals = days.map((_, i) => sumVals(rows.map((r) => r.values[i] ?? null)));
  const grandTotal = sumVals(colTotals);

  const rowLabelText = (row: TimesheetRow) => (typeof row.label === 'string' ? row.label : row.key);
  const cellLabel = (row: TimesheetRow, col: number, d: Date) =>
    `${fullDay(col)} ${d.getDate()}/${d.getMonth() + 1} · ${rowLabelText(row)}`;

  const borderCls = 'border-b border-line2';

  return (
    <div
      className={`overflow-hidden rounded-xl border border-line [background-image:var(--wash)] shadow-[var(--ele-1)] bg-s2${classNames?.wrapper ? ` ${classNames.wrapper}` : ''}${className ? ` ${className}` : ''}`}
    >
      {/* Thanh tuần: nhãn khoảng tuần + nav prev/next */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <span className="flex items-center gap-2 text-h3 font-semibold text-ink">
          <Icon name="calendar" size={14} className="text-ink3" />
          {weekLabel}
        </span>
        <span className="flex items-center gap-1">
          <button type="button" aria-label={str.prevWeek} onClick={() => nav(-7)} className={NAV_CLS}>
            <Icon name="chevron-left" size={14} />
          </button>
          <button type="button" aria-label={str.nextWeek} onClick={() => nav(7)} className={NAV_CLS}>
            <Icon name="chevron-right" size={14} />
          </button>
        </span>
      </div>

      <div className="overflow-auto">
        {/* key=weekKey → remount khi đổi tuần: replay fade-in + InputNumber
            uncontrolled nhận lại text đúng giá trị tuần mới */}
        <table
          key={weekKey}
          className="w-full border-collapse text-left animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)]"
        >
          <thead className={classNames?.header}>
            <tr>
              <th
                scope="col"
                className={`sticky left-0 top-0 z-20 min-w-40 bg-s3 px-3 py-2 text-label font-semibold text-ink2 ${borderCls}`}
              >
                {str.task}
              </th>
              {days.map((d, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`sticky top-0 z-10 min-w-24 bg-s3 px-2 py-2 text-center ${borderCls}`}
                >
                  <span className="text-meta font-semibold text-ink3">{weekdayShort(d)}</span>{' '}
                  <span className="text-label font-medium text-ink2 tabular-nums">{d.getDate()}</span>
                </th>
              ))}
              <th scope="col" className={`sticky top-0 z-10 min-w-20 bg-s3 px-3 py-2 text-right text-label font-semibold text-ink2 ${borderCls}`}>
                {str.total}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }, (_, r) => (
                  <tr key={`sk-${r}`}>
                    <th scope="row" className={`sticky left-0 z-10 bg-s2 px-3 py-2 ${borderCls}`}>
                      <Skeleton variant="text" />
                    </th>
                    {days.map((_, i) => (
                      <td key={i} className={`px-2 py-2 ${borderCls}`}>
                        <Skeleton variant="text" />
                      </td>
                    ))}
                    <td className={`px-3 py-2 ${borderCls}`}>
                      <Skeleton variant="text" />
                    </td>
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={row.key} className={classNames?.row}>
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 bg-s2 px-3 py-2 text-left align-middle font-medium ${borderCls}`}
                    >
                      <div className="text-body text-ink">{row.label}</div>
                      {row.meta != null && <div className="text-meta text-ink3">{row.meta}</div>}
                    </th>
                    {days.map((d, i) => {
                      const v = row.values[i] ?? null;
                      const weekend = i >= 5; // T7 + CN — 2 cột cuối, mọi locale
                      return (
                        <td
                          key={i}
                          aria-label={cellLabel(row, i, d)}
                          className={`border-b border-line2 ${editable ? 'p-1' : 'px-3 py-1.5 text-right'}${weekend ? ' bg-s3/60' : ''}${classNames?.cell ? ` ${classNames.cell}` : ''}`}
                        >
                          {editable ? (
                            <InputNumber
                              key={`${row.key}:${weekKey}:${i}`}
                              value={v ?? undefined}
                              min={0}
                              max={24}
                              step={0.5}
                              ariaLabel={cellLabel(row, i, d)}
                              onChange={(n) => onCellChange?.(row.key, i, n)}
                            />
                          ) : v === null ? null : (
                            <span className="text-body text-ink tabular-nums">{fmtNum(v)}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2 text-right ${borderCls}`}>
                      <span className="text-body font-medium text-ink tabular-nums">{fmtNum(sumVals(row.values))}</span>
                    </td>
                  </tr>
                ))}
          </tbody>
          {!loading && (
            <tfoot className={classNames?.footer}>
              <tr className="border-t border-line">
                <th scope="row" className="sticky left-0 z-10 bg-s3 px-3 py-2 text-left text-label font-semibold text-ink2">
                  {str.total}
                </th>
                {colTotals.map((t, i) => (
                  <td key={i} className="px-2 py-2 text-right">
                    <span className="text-body font-medium text-ink tabular-nums">{fmtNum(t)}</span>
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  <span className="text-body font-semibold text-ink tabular-nums">{fmtNum(grandTotal)}</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
