// Locale cho date-picker/calendar/time-picker (batch ⑧ worker C) — nhẹ, không i18n lib.
// File này chỉ export COMPONENT (DateLocaleProvider); constants + hook nằm ở locale-constants.ts
// (react-refresh/only-export-components). Re-export value ở dưới để GIỮ NGUYÊN import path cũ
// (calendar/time-picker/timesheet/src-index đang import từ module này).
export type { DateLocale, DateLocaleInput } from './locale-constants.js';
// eslint-disable-next-line react-refresh/only-export-components -- giữ ổn định import path cho consumer cũ; đáng lẽ trỏ thẳng locale-constants (timesheet đang giữ file — không chỉnh được)
export { VI_LOCALE, EN_LOCALE, resolveDateLocale, LocaleContext, useDateLocale } from './locale-constants.js';
import { LocaleContext, resolveDateLocale, type DateLocaleInput } from './locale-constants.js';
import type { ReactNode } from 'react';

/** Provider chia sẻ locale cho DatePicker/Calendar/TimePicker bên dưới (không bắt buộc — prop ưu tiên hơn). */
export function DateLocaleProvider({ locale = 'vi', children }: { locale?: DateLocaleInput; children: ReactNode }) {
  const resolved = resolveDateLocale(locale);
  return <LocaleContext.Provider value={resolved}>{children}</LocaleContext.Provider>;
}
