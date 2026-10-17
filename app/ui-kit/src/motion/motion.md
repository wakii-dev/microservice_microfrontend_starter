# Motion guidelines — identity "mượt mà" của ui-kit

## Nguyên tắc
1. **CHỈ animate transform + opacity** (GPU 60fps) — cấm width/height/top/left.
2. Mọi animation tôn trọng `prefers-reduced-motion` (fallback tức thì — tự động qua block global trong tailwind.css).
3. Exit nhanh hơn enter ~30% (element ra không cần chờ).
4. CSS thuần — KHÔNG runtime animation lib trong ui-kit (app-level có motion 12 riêng).

## Duration scale
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--motion-instant` | 90ms | hover tint, focus ring fade |
| `--motion-fast` | 160ms | exit animations, tooltip/popconfirm hide |
| `--motion-base` | 240ms | enter animations, drawer/modal open, tab transition |
| `--motion-slow` | 360ms | large surface, multi-element stagger |

## Easing
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--ease-enter` | cubic-bezier(0.16, 1, 0.3, 1) | element VÀO (decelerate — kết thúc mượt) |
| `--ease-exit` | cubic-bezier(0.4, 0, 1, 1) | element RA (accelerate — rời nhanh) |
| `--ease-toggle` | cubic-bezier(0.34, 1.56, 0.64, 1) | toggle/press (spring nhẹ — overshoot) |

## Khi nào animate gì
| Tình huống | Animation |
|---|---|
| Overlay mở (Modal/Drawer/Popover/Dropdown) | fade + zoom/slide-in, `--ease-enter --motion-base` |
| Overlay đóng | fade + zoom/slide-out, `--ease-exit --motion-fast` |
| Content xuất hiện (EmptyState/Result/feed) | fade-up, `--motion-base` |
| Button press | scale 0.97 (active), `--motion-instant` |
| Input focus ring | fade-in, `--motion-instant` |
| Switch/Checkbox tick | spring `--ease-toggle` |
| Notification/Message | slide-in-right → slide-out-right |
| Tab switch | gạch accent slide (không fade cả panel) |
| Skeleton | shimmer pulse 1.2s infinite |

## A11y
`prefers-reduced-motion: reduce` → toàn bộ animation/transition = 0.01ms (tức thì).
