# @boilerplate/fe-shared (fe-shared)

Repo-con thứ 7. **Từ story VU-53 SF-1: `src/styles/` + `src/ui/` do design-system SF sở hữu** (SF-2/3/4 consume; đụng logic files = flag coordinator). Shell/remotes copy đi nơi khác phải KÈM package này (standalone-copy definition, epic spec §SF-6).

## Nội dung

| Module | Chức năng |
|--------|-----------|
| `api-client` | Fetch wrapper: đính JWT (`Authorization: Bearer`) + decode error envelope (conventions/04) → throw `ApiError{status, code, requestId}` — READ-LOCKED |
| `token-storage` | Lưu/đọc JWT (localStorage, memory fallback) + `readClaims` (KHÔNG verify — verify là việc service) + `isExpired` (TTL 8h) — READ-LOCKED |
| `error-envelope` | Types + `decodeErrorEnvelope` — READ-LOCKED |
| `mf-bootstrap` | Load remote helper + remote registry resolution (URL từ env — conventions/08) — READ-LOCKED |
| `src/styles/` (SF-1) | Design tokens (`tokens.css`, `:root` idempotent) + global base (`base.css`, `@layer reset,base` + primitives CSS `bp-*`) — hướng B "Linear-referenced dark" |
| `src/ui/` (SF-1) | Primitives: `Badge` / `EmptyState` / `Skeleton` / `Spinner` — props API theo hand-off §3 |

## MF toolkit pin (kết quả spike SF-1)

Trường `mfToolkit.pinned` trong `package.json` = versions **đã test thật** (host load được remote trên Rspack, React 19). Spike: `app/spike/`. SF-5/6 dùng đúng matrix; nâng version = re-spike trước.

React 19 + Module Federation + Rspack là cặp rủi ro (repo đổi bundler internals) — KHÔNG nâng một mình một thành phần. Spike R2 (SF-1, VU-53): fe-shared JSX qua MF boundary sạch duplicate-react — evidence `docs/superpowers/evidence/sf-1-ui-redesign-dsys/spike-r2-result.md`.

## Design system — cách dùng (SF-2/3/4)

```tsx
// 1. Primitives — import từ barrel, props API tra hand-off §3 (source of truth)
import { Badge, EmptyState, Skeleton, Spinner } from '@boilerplate/fe-shared';
<Badge variant="doing">Đang làm</Badge>

// 2. CSS — shell import LÀM CHỦ global (1 lần duy nhất, shell entry):
import '@boilerplate/fe-shared/styles/tokens.css';
import '@boilerplate/fe-shared/styles/base.css';
// Remote trong shell KHÔNG import base (shell làm chủ global); standalone debug
// (:4001/:4002) tự import 2 file trên để có baseline style.

// 3. Tokens — mọi màu/spacing/type qua var(--token), KHÔNG hardcode hex mới.
//    Thiếu token = flag coordinator (không tự thêm).
```

Quy tắc: depth = surface ladder (`--c-s1..s3`) + viền 1px `--line`, KHÔNG box-shadow; accent `--accent` dùng có kỷ luật (nút chính, nav-active, focus ring, dot); `--ink3` chỉ cho meta ≥12px; animation bọc `prefers-reduced-motion`.

**Contract resolution react (SP spike R2)**: fe-shared KHÔNG khai báo react dep (giữ `pnpm-lock.yaml`) — **consumer cung cấp**: rspack `resolve.modules` (×3 config), vitest `resolve.alias` + `esbuild.jsx: 'automatic'` (shell vitest.config.ts), tsconfig `paths` ×3. Consumer mới (SF-5/6+) phải thiết lập đủ 3 lớp trước khi import JSX từ package này — không thì "Failed to resolve import react" / "React is not defined".
