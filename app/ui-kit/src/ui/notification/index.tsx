// Notification — static API kiểu antd: góc phải-trên, title + description,
// auto-dismiss 4.5s, đóng ×; container isConnected guard (pattern message).
// SÓNG-3: classNames slots (wrapper/title/content) — merge sau class mặc định.
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

/** antd v5-style sub-part slot classes — merge AFTER defaults (consumer appends). */
export interface NotificationClassNames {
  /** Toast card root. */
  wrapper?: string;
  /** Title line. */
  title?: string;
  /** Body area (title + description container). */
  content?: string;
}

const ICON: Record<NotificationType, string> = { success: '✓', info: 'ℹ', warning: '⚠', error: '✕' };
const COLOR: Record<NotificationType, string> = {
  success: 'text-st-done',
  info: 'text-accent',
  warning: 'text-st-doing',
  error: 'text-st-fail',
};

let container: HTMLDivElement | null = null;

function ensureContainer(): HTMLDivElement {
  if (!container || !container.isConnected) {
    container = document.createElement('div');
    container.className = 'pointer-events-none fixed right-4 top-4 z-[var(--z-toast)] flex w-[336px] flex-col gap-3';
    document.body.appendChild(container);
  }
  return container;
}

// slot helper — ghép class consumer vào sau mặc định (undefined → rỗng)
const slot = (c?: string) => (c ? ` ${c}` : '');

function show(type: NotificationType, title: string, description?: string, durationMs = 4500, classNames?: NotificationClassNames): void {
  const root = ensureContainer();
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className =
    `pointer-events-auto rounded-xl border border-line bg-s2 p-4 shadow-[var(--shadow-pop)]${slot(classNames?.wrapper)}`;
  // DOM API + textContent — KHÔNG innerHTML (title/description là input user → XSS surface)
  const wrap = document.createElement('div');
  wrap.className = 'flex items-start gap-2';
  const icon = document.createElement('span');
  icon.className = `text-label ${COLOR[type]}`;
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = ICON[type];
  const body = document.createElement('div');
  body.className = `min-w-0 flex-1${slot(classNames?.content)}`;
  const titleEl = document.createElement('div');
  titleEl.className = `text-body font-semibold text-ink${slot(classNames?.title)}`;
  titleEl.textContent = title;
  body.append(titleEl);
  if (description) {
    const descEl = document.createElement('div');
    descEl.className = 'mt-1 text-label text-ink2';
    descEl.textContent = description;
    body.append(descEl);
  }
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Đóng');
  closeBtn.className =
    'cursor-pointer rounded-1 border-none bg-transparent text-base leading-4 text-ink3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:opacity-70';
  closeBtn.textContent = '×';
  wrap.append(icon, body, closeBtn);
  el.append(wrap);
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
  closeBtn.addEventListener('click', remove);
  window.setTimeout(remove, durationMs);
}

export const notification = {
  success: (title: string, description?: string, classNames?: NotificationClassNames) => show('success', title, description, 4500, classNames),
  info: (title: string, description?: string, classNames?: NotificationClassNames) => show('info', title, description, 4500, classNames),
  warning: (title: string, description?: string, classNames?: NotificationClassNames) => show('warning', title, description, 4500, classNames),
  error: (title: string, description?: string, classNames?: NotificationClassNames) => show('error', title, description, 4500, classNames),
};
