# EXPERIENCE-DESIGN — hợp đồng thiết kế Templates/Cinematic Experience (v1.0 — SF-1)

> Nguồn: REF-SPEC (`docs/team/ref/REF-SPEC.md`, PO đo live 1280×800) + mindmap VU-53-CIN SF-1.
> **Mọi SF code theo file này.** Sửa contract = PR riêng + lead duyệt. IP: số đo/cấu trúc tham
> khảo ref — copy/ảnh/nội dung là Orca/Wakii (VN-flavored).

## 1. Typography scale (REF-SPEC — đo computed, dùng đúng số)

| Vai trò | Spec | Utility |
|---|---|---|
| Display / brand / CTA | **12px / 700 UPPERCASE / tracking 2.4px** | `text-[12px] font-bold uppercase tracking-[2.4px]` |
| Label mono (kicker, CHƯƠNG 0X) | **11px / 700 UPPERCASE / tracking 2.64px / font-mono** | `font-mono text-[11px] font-bold uppercase tracking-[2.64px]` |
| H1 hero | **18px / 300 LIGHT / uppercase / tracking 0.14em / line-height 1.6 / line-break chủ động** | `Typography.Title level={1}` + style |
| H2 chapter | **~29px / 300 light / leading-snug / tracking 0.02em** | `text-[29px] font-light leading-snug tracking-[0.02em]` |
| Hero editorial đoạn | **17px / 400 / leading 1.5** (cụm trái, KHÔNG caps) | `text-[17px] leading-[1.5]` |
| Body | **12px / 400 / tracking 0.3px / leading 1.7** | `text-[12px] leading-[1.7] tracking-[0.3px]` |
| Meta số (stats) | tabular-nums, 30px bold band / 3xl cards | `text-3xl font-bold tabular-nums` |

Quy tắc: KHÔNG bold to (editorial LIGHT); heading lớn chỉ ≥3:1, body ≥4.5:1 (WCAG luminance — verify script trong story mood-engine).

## 2. Palette 5 mood + hero/end (token + gradient stops từng chương)

Token nền tự chủ (không theo theme — thêm 1 lần vào `styles/tokens.css`, đã có):
`--hero-sky-a: #ffffff` · `--hero-sky-b: #e8edf4` · `--navy-ink: rgb(16,36,52)` ·
`--hero-ink: rgb(16,36,52)` (cố định, KHÔNG flip dark) · `--chapter-bg-a: rgb(10,12,22)` ·
`--chapter-bg-b: rgb(16,36,52)`.

| # | Mood id | Chương | Gradient stops (background) | Ink | Dot/nhấn |
|---|---|---|---|---|---|
| 0 | `atlas` | Hero | `165deg, #cdd8f6 0% → var(--hero-sky-a) 55% → #dfe4fb 100%` (light-cố định) | `--navy-ink` (light) / trắng (dark) | `#ff5c39` ◆ |
| 1 | `focus` | Ch1 Deep focus | `180deg, var(--chapter-bg-a) → var(--chapter-bg-b)` | `white/92` body · `white` heading | `--st-done` |
| 2 | `docs` | Ch2 Living docs | `180deg, var(--chapter-bg-b) → rgb(10,20,38)` | `white/85` | `--accent` (duotone ảnh accent→done multiply) |
| 3 | `velocity` | Ch3 Velocity | `180deg, var(--chapter-bg-a) → color-mix(in srgb, var(--accent) 14%, rgb(10,12,22))` | `white/92` | mood accent LIVE (`#5e6ad2/#0d9488/#ea580c` — text dùng `accent-hi` ≥4.5:1) |
| 4 | `ship` | Ch4 Ship 3D | `180deg, rgb(10,12,22) → var(--scrim-4)` + ảnh `opacity-60` + `from-black/85 via-black/55` | `white` | `--accent` |
| 5 | `future` | Ch5 + End CTA | `180deg, var(--c-s1) → var(--c-canvas)` (sáng trở lại) | `--ink` (theme-flip — nền sáng cả dark) | `--st-done` |

Crossfade: `MoodBackdrop` (lib/scroll-mood) render 1 layer absolute/mood, opacity
`clamp(0, 1 − |p×(N−1) − i|, 1)` với `p` = progress scroll toàn trang (rAF) — chạy mượt
liên tục, không re-render content.

## 3. Spacing scale

| Khoảng | Giá trị |
|---|---|
| Section programmatic padding | `py-16` (chapter) · hero/end `min-h-screen` + `p-6` |
| Content rail | `mx-auto max-w-5xl px-10` (max-md px-6) |
| Grid chapter | `md:grid-cols-2 gap-8 items-center` |
| Card gap | `gap-4` grid · `gap-2` list feature · `gap-10` KPI |
| Pinned | section `h-[200vh]` + con `sticky top-0 h-screen overflow-hidden` |
| Side-nav | `fixed left-6` w-44, offsetTop 0, ẩn < md |

## 4. Motion vocabulary (duy nhất các hiệu ứng này)

| Hiệu ứng | Thông số | Dùng ở |
|---|---|---|
| Parallax nền-gần-fixed | `speed 0.08 / strength 280` | hero BG · chapter BG · ch4 |
| Parallax lớp giữa | `speed 0.3 / strength 240` | gate checklist · quote |
| Parallax chữ dẫn đầu | `speed 0.5 / strength 280` | hero content · ch4 chữ |
| Reveal | direction up/left/right · `delay 80–320ms, stagger +90ms` | sections/cards/features |
| CountUp | `duration 1.2s` default · format vi-VN | KPI/CTA/ch1 |
| Mask-reveal ảnh | `clip-path inset(0 X% 0 0)` theo `useSectionProgress` | ch2/ch3 ảnh |
| Split-text reveal | từng chữ stagger CSS (template-local) | ch1 |
| Mood crossfade | `MoodBackdrop` rAF — opacity nội suy tuyến tính | toàn trang |
| Sun journey | cung sin x10→90% · y 20→8→20% · 4 pha | section riêng |
| UI micro | 150–250ms + `--ease-enter/exit` · infinite CHỈ trạng thái (pulse WIP) | — |

`prefers-reduced-motion`: Parallax/Reveal/CountUp/Scene3D tự tắt (frame tĩnh) — không chapter nào tự viết motion ngoài vocabulary.

## 5. Ảnh-grade chuẩn (Avatar/Getty graded — mọi ảnh trong chapters)

1. Ảnh gốc `grayscale` (Tailwind filter).
2. Overlay duotone: `bg-gradient-to-tr from-accent/25 via-transparent to-st-done/20 mix-blend-multiply` (accent theo mood chương).
3. Vignette mép: `[box-shadow:inset_0_0_90px_var(--scrim-2)]`.
4. Mask-reveal clip-path khi muốn lộ dần (xem motion). Overlay nằm TRONG wrapper bị clip.

## 6. A11y & quality gate

- Chapter container: `<section id="chN" data-mood="<mood-id>" className="relative min-h-screen">`.
- CTA là `button`/`a` thật; heading h2/chương; Icon trang trí aria-hidden (default).
- Contrast: body ≥4.5:1, heading ≥3:1 — verify bằng script luminance (story mood-engine log số).
- Chỉnh màu chapter KHÔNG dùng token flip (--ink/--ink2) — dùng white-alpha cố định (nền tự chủ tối).

## 7. Đổi contract

PR riêng sửa file này + đánh版本 v1.x. Chapter không theo contract = gate fail (lead check bằng số đo trong verify paste).
