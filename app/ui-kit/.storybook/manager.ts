// Manager UI theme — "Đồng bộ ui-kit": chrome Storybook map 1:1 tokens
// styles/tokens.css (antd-look light, decision 2026-10-17) — Storybook mặc
// đúng áo của design system nó documenting. Nguồn giá trị ghi cạnh mỗi key;
// đổi token ở tokens.css = đổi ở đây cùng commit.
// Chi tiết selector-spezifisch (sidebar item/search/scrollbar) ở manager-head.html.
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Font stacks — mirror --f / --m (tokens.css)
const FONT_BASE =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
const FONT_MONO =
  '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

addons.setConfig({
  theme: create({
    base: 'light',

    // Brand
    brandTitle: 'Wakii UI Kit',
    brandUrl: 'https://storybook-static-khaki-two.vercel.app',
    // Mark chữ W (khối accent bo r-1) + wordmark — brandImage thay thế title
    // trong sidebar header nên ghép cả 2 vào SVG (font --f, mực --ink).
    brandImage: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="24" viewBox="0 0 128 24"><rect width="24" height="24" rx="6" fill="#1677ff"/><path d="M5.5 8l2.6 8L10.7 10.4 13.3 16l2.6-8" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="32" y="16.5" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif" font-size="14" font-weight="600" fill="rgba(0,0,0,0.88)">Wakii UI Kit</text></svg>',
    )}`,

    // Accent — --accent / --accent-hi
    colorPrimary: '#1677ff',
    colorSecondary: '#4096ff',

    // Nền khung — --c-canvas (sidebar) / --c-s2 (content)
    appBg: '#f5f5f5',
    appContentBg: '#ffffff',
    // Viền — --line (cool-tint hairline)
    appBorderColor: '#e2e5ea',
    appBorderRadius: 8, // --r-2

    // Toolbar — khối trắng, chữ --ink2
    barBg: '#ffffff',
    barTextColor: 'rgba(0, 0, 0, 0.65)',
    barSelectedColor: '#1677ff',
    barHoverColor: '#4096ff',

    // Mực — 4 mức antd colorText
    textColor: 'rgba(0, 0, 0, 0.88)',
    textInverseColor: '#ffffff',
    textMutedColor: 'rgba(0, 0, 0, 0.45)',

    // Inputs (search box...) — nền --c-s3
    inputBg: '#fafafa',
    inputBorder: '#e2e5ea',
    inputTextColor: 'rgba(0, 0, 0, 0.88)',

    // Buttons — mirror Button default (nền s2 viền line)
    buttonBg: '#ffffff',
    buttonBorder: '#e2e5ea',

    fontBase: FONT_BASE,
    fontCode: FONT_MONO,
  }),
});


// Ẩn teaser SB "Learn what's new" ở đáy sidebar — class là emotion-hash
// (đổi mỗi build) nên match theo nội dung; MutationObserver phòng render
// muộn sau boot. (SB strip <script> inline khỏi manager-head nên phải ở đây.)
function hideVersionTeaser(): void {
  const els = document.querySelectorAll<HTMLElement>('nav div, aside div, #root div');
  for (const el of els) {
    const text = (el.textContent ?? '').trim();
    if (text.includes("Learn what's new") && text.length < 120) {
      el.style.display = 'none';
    }
  }
}
if (typeof document !== 'undefined') {
  hideVersionTeaser();
  if (document.body) {
    new MutationObserver(hideVersionTeaser).observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      hideVersionTeaser();
      new MutationObserver(hideVersionTeaser).observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }
}
