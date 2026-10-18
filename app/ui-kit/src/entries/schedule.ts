// Entry subpath 'wakii-ui-kit/schedule' (batch ⑩) — import riêng Schedule không qua barrel.
// Schedule là peer-dep lazy (fullcalendar import động trong runtime, consumer tự cài —
// xem ui/schedule/index.tsx); hiện không có CSS import tĩnh nên entry là pure re-export.
// Nếu thêm CSS fullcalendar (@fullcalendar/daygrid/index.css) thì import TẠI ĐÂY.
export { Schedule, type ScheduleProps, type ScheduleEvent } from '../ui/schedule/index.js';
