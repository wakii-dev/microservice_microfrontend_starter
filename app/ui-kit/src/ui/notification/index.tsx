// Notification — static API kiểu antd: góc phải-trên, title + description,
// auto-dismiss 4.5s, đóng ×; container isConnected guard (pattern message).
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

const ICON: Record<NotificationType, string> = { success: '✓', info: 'ℹ', warning: '⚠', error: '✕' };
const COLOR: Record<NotificationType, string> = {
  success: 'text-st-done',
  info: 'text-accent',
  warning: 'text-st-doing',
  error: 'text-st-fail',
};

let container: HTMLDivElement | null = null;
let seq = 0;

function ensureContainer(): HTMLDivElement {
  if (!container || !container.isConnected) {
    container = document.createElement('div');
    container.className = 'pointer-events-none fixed right-4 top-4 z-[var(--z-toast)] flex w-[336px] flex-col gap-3';
    document.body.appendChild(container);
  }
  return container;
}

function show(type: NotificationType, title: string, description?: string, durationMs = 4500): void {
  const root = ensureContainer();
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className =
    'pointer-events-auto rounded-3 border border-line bg-s2 p-4 shadow-[0_6px_16px_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]';
  el.innerHTML = `
    <div class="flex items-start gap-2">
      <span class="text-label ${COLOR[type]}" aria-hidden="true">${ICON[type]}</span>
      <div class="min-w-0 flex-1">
        <div class="text-body font-semibold text-ink">${title}</div>
        ${description ? `<div class="mt-1 text-label text-ink2">${description}</div>` : ''}
      </div>
      <button type="button" aria-label="Đóng" class="cursor-pointer border-none bg-transparent text-base leading-4 text-ink3">×</button>
    </div>`;
  root.appendChild(el);
  // Motion identity: enter slide-in-right + fade; exit slide-out (nhanh hơn enter ~30%)
  if (typeof el.animate === 'function') {
    el.animate(
      [
        { opacity: 0, transform: 'translateX(24px)' },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  }
  const remove = () => {
    if (typeof el.animate === 'function') {
      const exit = el.animate(
        [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(24px)' }],
        { duration: 160, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
      );
      exit.onfinish = () => el.remove();
    } else {
      el.remove();
    }
  };
  const closeBtn = el.querySelector('button');
  closeBtn?.addEventListener('click', remove);
  window.setTimeout(remove, durationMs);
}

export const notification = {
  success: (title: string, description?: string) => show('success', title, description),
  info: (title: string, description?: string) => show('info', title, description),
  warning: (title: string, description?: string) => show('warning', title, description),
  error: (title: string, description?: string) => show('error', title, description),
};
