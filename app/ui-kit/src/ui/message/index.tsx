// Message — toast gọn kiểu antd message (static API: message.success('…')).
// Container tự tạo 1 lần (portal-free: div fixed gắn body khi gọi đầu tiên);
// auto-dismiss 3s + motion slide-down. KHÔNG thay Alert cho error cần hiển thị lâu.
// SÓNG-3: classNames slots (wrapper/icon/content) — merge sau class mặc định.
import type { AlertType } from '../alert/index';

export type MessageType = Exclude<AlertType, 'warning'> | 'warning';

/** antd v5-style sub-part slot classes — merge AFTER defaults (consumer appends). */
export interface MessageClassNames {
  /** Toast root. */
  wrapper?: string;
  /** Status glyph span. */
  icon?: string;
  /** Content span. */
  content?: string;
}


const ICON: Record<MessageType, string> = { success: '✓', info: 'ℹ', warning: '⚠', error: '✕' };
const COLOR: Record<MessageType, string> = {
  success: 'text-st-done',
  info: 'text-accent',
  warning: 'text-st-doing',
  error: 'text-st-fail',
};

let container: HTMLDivElement | null = null;

function ensureContainer(): HTMLDivElement {
  // isConnected guard: container có thể bị detach (cleanup test / HMR) — tái tạo
  if (!container || !container.isConnected) {
    container = document.createElement('div');
    container.className = 'pointer-events-none fixed inset-x-0 top-4 z-[var(--z-toast)] flex flex-col items-center gap-2';
    document.body.appendChild(container);
  }
  return container;
}

// slot helper — ghép class consumer vào sau mặc định (undefined → rỗng)
const slot = (c?: string) => (c ? ` ${c}` : '');

function show(type: MessageType, content: string, durationMs = 3000, classNames?: MessageClassNames): void {
  const root = ensureContainer();
  const el = document.createElement('div');
  el.className = `pointer-events-auto flex items-center gap-2 rounded-xl border border-line bg-s2 px-3 py-2 text-body text-ink shadow-[var(--shadow-pop)]${slot(classNames?.wrapper)}`;
  el.setAttribute('role', 'status');
  // DOM API + textContent — KHÔNG innerHTML (content có thể là input user → XSS surface)
  const icon = document.createElement('span');
  icon.className = `text-label ${COLOR[type]}${slot(classNames?.icon)}`;
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = ICON[type];
  const text = document.createElement('span');
  if (classNames?.content) text.className = classNames.content;
  text.textContent = content;
  el.append(icon, text);
  root.appendChild(el);
  // motion 12 standalone: animate qua Web Animations (không cần React root)
  // WAAPI — jsdom test không có Element.animate → guard (toast vẫn remove đúng)
  if (typeof el.animate === 'function') {
    el.animate(
      [
        { opacity: 0, transform: 'translateY(-12px) scale(0.97)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: 180, easing: 'ease-out' },
    );
  }
  window.setTimeout(() => {
    if (typeof el.animate === 'function') {
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-in' }).onfinish =
        () => el.remove();
    } else {
      el.remove();
    }
  }, durationMs);
}

export const message = {
  success: (content: string, classNames?: MessageClassNames) => show('success', content, 3000, classNames),
  info: (content: string, classNames?: MessageClassNames) => show('info', content, 3000, classNames),
  warning: (content: string, classNames?: MessageClassNames) => show('warning', content, 3000, classNames),
  error: (content: string, classNames?: MessageClassNames) => show('error', content, 3000, classNames),
};

