// Message — toast gọn kiểu antd message (static API: message.success('…')).
// Container tự tạo 1 lần (portal-free: div fixed gắn body khi gọi đầu tiên);
// auto-dismiss 3s + motion slide-down. KHÔNG thay Alert cho error cần hiển thị lâu.
import type { AlertType } from '../alert/index';

export type MessageType = Exclude<AlertType, 'warning'> | 'warning';


const ICON: Record<MessageType, string> = { success: '✓', info: 'ℹ', warning: '⚠', error: '✕' };
const COLOR: Record<MessageType, string> = {
  success: 'text-st-done',
  info: 'text-accent',
  warning: 'text-st-doing',
  error: 'text-st-fail',
};

let container: HTMLDivElement | null = null;
let seq = 0;

function ensureContainer(): HTMLDivElement {
  // isConnected guard: container có thể bị detach (cleanup test / HMR) — tái tạo
  if (!container || !container.isConnected) {
    container = document.createElement('div');
    container.className = 'pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2';
    document.body.appendChild(container);
  }
  return container;
}

function show(type: MessageType, content: string, durationMs = 3000): void {
  const root = ensureContainer();
  const id = ++seq;
  const el = document.createElement('div');
  el.className = 'pointer-events-auto flex items-center gap-2 rounded-2 border border-line bg-s2 px-3 py-2 text-body text-ink shadow-lg';
  el.innerHTML = `<span class="text-label ${COLOR[type]}" aria-hidden="true">${ICON[type]}</span><span>${content}</span>`;
  el.setAttribute('role', 'status');
  root.appendChild(el);
  // motion 12 standalone: animate qua Web Animations (không cần React root)
  // WAAPI — jsdom test không có Element.animate → guard (toast vẫn remove đúng)
  if (typeof el.animate === 'function') {
    el.animate(
      [
        { opacity: 0, transform: 'translateY(-12px)' },
        { opacity: 1, transform: 'translateY(0)' },
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
  success: (content: string) => show('success', content),
  info: (content: string) => show('info', content),
  warning: (content: string) => show('warning', content),
  error: (content: string) => show('error', content),
};

