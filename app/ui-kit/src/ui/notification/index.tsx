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

// Path data GỐC primeicons 7.0.0 (style sweep 2026-10-23 — bỏ glyph ký tự text).
// Copy từ src/ui/icons/index.tsx (PATHS không export; file này DOM thuần không
// React) — dựng svg bằng createElementNS, KHÔNG innerHTML (title/description
// vẫn textContent — user input không bao giờ parse HTML/XSS).
// close × — glyph times (icon 'error' của bộ Icon dùng cùng path này)
const TIMES_PATH =
  'M13.06,12l4.42-4.42a.75.75,0,1,0-1.06-1.06L12,10.94,7.58,6.52A.75.75,0,0,0,6.52,7.58L10.94,12,6.52,16.42a.75.75,0,0,0,0,1.06.75.75,0,0,0,1.06,0L12,13.06l4.42,4.42a.75.75,0,0,0,1.06,0,.75.75,0,0,0,0-1.06Z';

const STATUS_PATHS: Record<NotificationType, string[]> = {
  success: [
    'M9,18.25A.74.74,0,0,1,8.47,18l-5-5A.75.75,0,1,1,4.53,12L9,16.44,19.47,6A.75.75,0,0,1,20.53,7l-11,11A.74.74,0,0,1,9,18.25Z',
  ],
  info: [
    'M12,16.75a.76.76,0,0,1-.75-.75V11a.75.75,0,0,1,1.5,0v5A.76.76,0,0,1,12,16.75Z',
    'M12,9.25a.76.76,0,0,1-.75-.75V8a.75.75,0,0,1,1.5,0v.5A.76.76,0,0,1,12,9.25Z',
    'M12,21a9,9,0,1,1,9-9A9,9,0,0,1,12,21ZM12,4.5A7.5,7.5,0,1,0,19.5,12,7.5,7.5,0,0,0,12,4.5Z',
  ],
  warning: [
    'M20,18.75H4a.76.76,0,0,1-.65-.37.77.77,0,0,1,0-.75l8-14a.78.78,0,0,1,1.3,0l8,14a.77.77,0,0,1,0,.75A.76.76,0,0,1,20,18.75ZM5.29,17.25H18.71L12,5.51Z',
    'M12,13.25a.76.76,0,0,1-.75-.75V9a.75.75,0,0,1,1.5,0v3.5A.76.76,0,0,1,12,13.25Z',
    'M12,16.25a.76.76,0,0,1-.75-.75V15a.75.75,0,0,1,1.5,0v.5A.76.76,0,0,1,12,16.25Z',
  ],
  error: [TIMES_PATH],
};

/** SVG inline mirror markup bộ Icon (viewBox 24, fill currentColor, aria-hidden). */
function statusIcon(paths: string[], size = 14): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('focusable', 'false');
  for (const d of paths) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}

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
  icon.append(statusIcon(STATUS_PATHS[type]));
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
  closeBtn.append(statusIcon([TIMES_PATH], 14));
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
