# UI Redesign Direction — Hướng B "Linear-referenced dark" (VU-53)

> Source of truth thiết kế cho SF-1..SF-4. User chốt 2026-10-13 ("tôi chọn hướng B"). Visual chuẩn: `drafts/b-reference.html` (+ `.png` 1440×900). Gate record: `direction-approved.md`.
> Tham chiếu đã xác minh: Linear (linear.app/brand; DESIGN.md tokens: surface `#010102→#191a1b`, ink `#f7f8f8/#d0d6e0/#8a8f98`, line `#23252a`, accent `#5e6ad2`, radius 4/6/8, không bóng). **Chuyển dịch ngữ pháp thị giác, không copy thương hiệu** — không dùng logo/name Linear trong code.

## 1. Tokens (→ `frontend/shared/src/styles/tokens.css`)

```css
:root {
  /* Bậc bề mặt (thay cho shadow: depth bằng surface, KHÔNG box-shadow) */
  --c-canvas: #010102;   /* nền ngoài cùng */
  --c-s1:     #0f1011;   /* khối lớn (nav, sidebar) */
  --c-s2:     #141516;   /* card / panel */
  --c-s3:     #18191a;   /* row, input, hover surface */
  /* Mực (text) */
  --ink:      #f7f8f8;   /* chính — contrast vs #141516 ≈ 15:1 AA✓ */
  --ink2:     #d0d6e0;   /* phụ (desc) — ≈ 10:1 AA✓ */
  --ink3:     #8a8f98;   /* meta (uuid, time) — ≈ 4.6:1: CHỈ cho meta phụ ≥12px */
  /* Viền */
  --line:     #23252a;   /* 1px mặc định */
  --line2:    #2b2d33;   /* hover/focus ring nền */
  /* Accent duy nhất */
  --accent:   #5e6ad2;   /* Florentine indigo — nút chính, nav active, avatar, timeline dot */
  --accent-hi:#828fff;   /* hover accent + focus-visible outline */
  /* Trạng thái task */
  --st-todo:  #8a8f98;   /* Cần làm */
  --st-doing: #f2c94c;   /* Đang làm */
  --st-done:  #3fb950;   /* Xong */
  --st-fail:  #f06a6a;   /* Gán thất bại + error */
  /* Font stacks (CỨNG — 0 webfont) */
  --f: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --m: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
  /* Radius */
  --r-1: 4px;  /* chip nhỏ, input */
  --r-2: 6px;  /* button, pill */
  --r-3: 8px;  /* card, panel */
  --r-pill: 9999px;
  /* Spacing scale 4base */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px;
  /* Type scale */
  --fs-meta: 12px; --fs-label: 13px; --fs-body: 14px; --fs-h2: 16px; --fs-h1: 18px;
}
```

Quy tắc phân cấp: **depth = surface ladder** (canvas→s1→s2→s3) + viền 1px `--line`; KHÔNG box-shadow. Accent `--accent` xuất hiện có kỷ luật: nút chính, nav-active underline/dot, avatar, dot timeline, focus ring — không rải.

## 2. Base (→ `base.css`, `@layer reset,base`, shell import LÀM CHỦ global)

Reset mỏng (box-sizing, margin 0) + element defaults: body (`--c-canvas`, `--ink`, `--f`, `--fs-body`, line-height 1.5), form control (input/select/textarea: nền `--c-s3`, viền `--line`, radius `--r-1`, `--fs-body`; focus-visible outline 2px `--accent-hi`), button (radius `--r-2`, cursor), `.error-banner` (viền `--st-fail` 1px + nền `#f06a6a`@10% + `role=alert` styling), `.skip-link`. Media queries: ≤768px (nav wrap, list 1 cột, stats grid 2 cột), ≥1024px layout đầy đủ.

## 3. Component spec + props API (→ `fe-shared/src/ui/` — SF-1 implement, mọi SF consume ĐÚNG shape)

```ts
// Badge.tsx — pill chấm-màu + nhãn; role="status"
type BadgeVariant =
  | 'todo' | 'doing' | 'done' | 'failed'            // task status (dot #8a8f98/#f2c94c/#3fb950/#f06a6a)
  | 'created' | 'updated' | 'assigned' | 'deleted' | 'assignmentFailed' // activity action
interface BadgeProps { variant: BadgeVariant; children: ReactNode }
// Render: <span class="bp-badge bp-badge--{variant}" role="status"><span class="bp-badge__dot"/>{children}</span>
// CSS: nền surface theo variant ≤12% alpha của màu dot + dot 6px + chữ --ink2 12px/1.25 pill --r-pill
// Mapping activity: created=--accent, updated=--st-doing, assigned=--accent-hi, deleted=--ink3, assignmentFailed=--st-fail

// EmptyState.tsx — icon KHÔNG (không emoji); tiêu đề + mô tả + optional action
interface EmptyStateProps { title: string; description?: string; action?: ReactNode }

// Skeleton.tsx — khối nền #23252a pulse; aria-busy wrapper
interface SkeletonProps { variant: 'text' | 'row' | 'card'; count?: number }
// Shimmer: opacity .5→1 1.2s ease-in-out infinite; @media (prefers-reduced-motion: reduce) → tắt animation

// Spinner.tsx — vòng 14px viền 2px quay; dùng per-item busy
interface SpinnerProps { label: string } // aria-label bắt buộc
```

## 4. Layout patterns (SF-2/3/4 áp per surface)

- **App chrome (shell)**: nav nền `--c-s1` đáy viền `--line`; item active = chữ `--ink` + gạch `--accent` 2px dưới; inactive `--ink3`; phải: chip user (avatar 20px tròn nền `--accent`@15% chữ cái đầu + email `--fs-meta`) + nút Đăng xuất ghost. Main max-width 1200px padding `--sp-5`.
- **Task row (hero)**: pill status + title `--fs-body --ink` + desc `--fs-label --ink2` ellipsis 1 dòng; cột phải mono `--fs-meta --ink3`: uuid rút gọn / thời gian vi-VN; hover nền `--c-s3`; per-item busy = Spinner thay dot.
- **Stats card**: giá trị 18px `--ink` + nhãn 12px `--ink3`, nền `--c-s2` viền `--line` radius `--r-3`; grid auto-fit minmax(140px,1fr).
- **Timeline feed**: dot 6px theo action color + line dọc `--line`; entry: "«tên» {action label}" + time mono phải; nhóm theo ngày heading 12px `--ink3`.
- **Login card**: giữa màn hình, `--c-s2` radius `--r-3` viền `--line` padding `--sp-6`, wordmark "Boilerplate" 18px, nút chính nền `--accent` chữ trắng full-width.

## 5. Motion (tối giản)

Chỉ hover/focus transition 150ms ease; skeleton shimmer (§3); KHÔNG animation vào/ra trang. Mọi animation bọc `prefers-reduced-motion: reduce` → tắt.

## 6. Contrast đã kiểm (AA)

`--ink`/`--ink2` trên mọi surface ≥ 10:1 ✓; `--ink3` ≈ 4.6:1 — chỉ meta ≥12px; accent `#5e6ad2` trên `--c-canvas` ≈ 4.6:1 — dùng cho UI marker, KHÔNG dùng cho body text; nút accent chữ `#fff` ✓; benchmark cũ `#742a2a/#fed7d7` không còn dùng (palette thay hoàn toàn).

## 7. Archive

- Hướng A (Sound-Viz) giữ lại `drafts/a-roulette-soundviz.*` làm record — KHÔNG implement.
- Bản B là canonical: mọi quyết định visual tra `drafts/b-reference.html` trước, file này second.
