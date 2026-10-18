// Locale cho date-picker/calendar/time-picker (batch ⑧ worker C) — nhẹ, không i18n lib.
// Chia sẻ qua DateLocaleProvider (context) HOẶC prop `locale` từng component
// (prop thắng context, default 'vi'). UiKitProvider cố tình context-free
// (attr + CSS vars) nên locale context đặt riêng ở đây — không đụng provider/.
import { createContext, useContext, type ReactNode } from 'react';

export interface DateLocale {
  months: string[]; // 12 tên tháng (vd 'Tháng 1' / 'January')
  /** 7 label ngày trong tuần — xếp theo thứ tự BẮT ĐẦU từ firstDayOfWeek. */
  weekdays: string[];
  /** 0 = Chủ nhật đầu tuần (en), 1 = Thứ hai đầu tuần (vi). */
  firstDayOfWeek: 0 | 1;
  prevMonth: string; // aria nút tháng trước
  nextMonth: string; // aria nút tháng sau
  today: string; // nút chân panel
  now: string; // nút nhanh TimePicker
  ok: string; // nút xác nhận (showTime)
  placeholder: string;
  triggerLabel: string; // aria trigger single
  rangeFrom: string; // aria/label input from
  rangeTo: string; // aria/label input to
  hour: string;
  minute: string;
  increase: string; // aria btn tăng (vd 'Tăng')
  decrease: string; // aria btn giảm
  timeTriggerLabel: string; // aria trigger TimePicker khi trống
  timeValuePrefix: string; // aria trigger khi có value (vd 'Giờ:')
  dateValuePrefix: string; // aria trigger DatePicker khi có value (vd 'Ngày:')
}

export const VI_LOCALE: DateLocale = {
  months: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  weekdays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  firstDayOfWeek: 1,
  prevMonth: 'Tháng trước',
  nextMonth: 'Tháng sau',
  today: 'Hôm nay',
  now: 'Bây giờ',
  ok: 'OK',
  placeholder: 'Chọn ngày…',
  triggerLabel: 'Chọn ngày',
  rangeFrom: 'Từ ngày',
  rangeTo: 'Đến ngày',
  hour: 'Giờ',
  minute: 'Phút',
  increase: 'Tăng',
  decrease: 'Giảm',
  timeTriggerLabel: 'Chọn giờ',
  timeValuePrefix: 'Giờ:',
  dateValuePrefix: 'Ngày:',
};

export const EN_LOCALE: DateLocale = {
  months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  firstDayOfWeek: 0,
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  today: 'Today',
  now: 'Now',
  ok: 'OK',
  placeholder: 'Pick a date…',
  triggerLabel: 'Pick date',
  rangeFrom: 'From date',
  rangeTo: 'To date',
  hour: 'Hour',
  minute: 'Minute',
  increase: 'Increase',
  decrease: 'Decrease',
  timeTriggerLabel: 'Pick time',
  timeValuePrefix: 'Time:',
  dateValuePrefix: 'Date:',
};

export type DateLocaleInput = 'vi' | 'en' | DateLocale;

export function resolveDateLocale(locale?: DateLocaleInput): DateLocale {
  if (!locale || locale === 'vi') return VI_LOCALE;
  if (locale === 'en') return EN_LOCALE;
  return locale;
}

const LocaleContext = createContext<DateLocale>(VI_LOCALE);

/** Provider chia sẻ locale cho DatePicker/Calendar/TimePicker bên dưới (không bắt buộc — prop ưu tiên hơn). */
export function DateLocaleProvider({ locale = 'vi', children }: { locale?: DateLocaleInput; children: ReactNode }) {
  const resolved = resolveDateLocale(locale);
  return <LocaleContext.Provider value={resolved}>{children}</LocaleContext.Provider>;
}

/** Prop `locale` thắng context; không có cả hai → vi. */
export function useDateLocale(locale?: DateLocaleInput): DateLocale {
  const ctx = useContext(LocaleContext);
  return locale ? resolveDateLocale(locale) : ctx;
}
