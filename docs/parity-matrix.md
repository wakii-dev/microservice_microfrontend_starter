# Parity matrix — antd v6 default → tokens.css

Nguồn: `app/ui-kit/node_modules/antd/es/theme/themes/seed.js` (đọc trực tiếp package cài).
Tailwind v4 `@theme inline` (styles/tailwind.css) map thẳng var() — utilities tự theo tokens.

| antd token | Giá trị | tokens.css |
|---|---|---|
| colorPrimary | #1677ff | --accent |
| colorPrimaryHover | #4096ff | --accent-hi |
| colorText | rgba(0,0,0,.88) | --ink |
| colorTextSecondary | rgba(0,0,0,.65) | --ink2 |
| colorTextTertiary | rgba(0,0,0,.45) | --ink3 |
| colorTextQuaternary (placeholder/disabled) | rgba(0,0,0,.25) | --ink4 |
| colorBgContainerDisabled | rgba(0,0,0,.04) | --bg-disabled |
| colorBorder | #d9d9d9 | --line |
| colorBorderSecondary | #f0f0f0 | --line2 |
| colorBgLayout | #f5f5f5 | --c-canvas |
| colorBgContainer | #ffffff | --c-s1 / --c-s2 |
| colorFillQuaternary | #fafafa | --c-s3 |
| colorSuccess / Warning / Error / Info | #52c41a / #faad14 / #ff4d4f / #1677ff | --st-done / --st-doing / --st-fail / --accent |
| borderRadius 6 / LG 8 | 6/8px | --r-2 / --r-3 |
| borderRadiusSM | 4px | --r-1 (Tag, Checkbox) |
| controlHeight 32 | 32px | h-8 utilities |
| fontSize 14 | 14px | --fs-body |
| fontFamily | system stack | --f |

Dark theme: `themes/dark.css` (data-bp-theme='dark') — archive direction B VU-53.
