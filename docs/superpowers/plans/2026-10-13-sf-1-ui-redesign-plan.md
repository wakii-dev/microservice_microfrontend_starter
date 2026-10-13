# Plan — SF-1 Design-system nền móng (VU-54, story VU-53 UI redesign)

> Tier: Standard. Spec: `docs/superpowers/contexts/ui-redesign/sf-1.md` + hand-off
> `docs/superpowers/designs/ui-redesign-direction.md` (source of truth — user đã duyệt hướng B).
> Worktree: `sf-1-ui-redesign-dsys` (story-hub model — push nhánh, coordinator merge).
> Cứng: `pnpm-lock.yaml` KHÔNG đổi; 4 file logic fe-shared + `mfToolkit` READ-LOCKED.

## Tasks

- [x] T1 — `fe-shared/src/styles/tokens.css` + `base.css` đúng hand-off §1-2 (tokens `:root` idempotent; base `@layer reset,base`; shell là chủ global khi SF-2 wire — SF-1 không đụng shell entry)
- [x] T2 — Rspack ×3: remotes thêm css rule (`type:'css'`) + `experiments.css` (copy shell `rspack.config.mjs:42-45,85-87`); `'react/jsx-runtime'` singleton + `requiredVersion:false` vào shared CẢ 3 config; `output.cssFilename` contenthash prod ×3; `declare module '*.css'` env.d.ts ×3
- [x] T3 — SPIKE R2 SỚM: JSX stub (useState + onClick) trong `fe-shared/src/ui/jsx-probe.tsx`, temp-render trong tasks remote; build 3 package; dev servers riêng (3100/4101/4102 — FE docker chiếm 3000/4001/4002); login → tasks → đổi status qua select; console KHÔNG có "Invalid hook call"/"2 copies of React"; screenshot evidence
- [x] T4 — Primitives TDD: tests `shell/tests/primitives.test.tsx` TRƯỚC (RED) → implement `Badge/EmptyState/Skeleton/Spinner` đúng props API hand-off §3 (CSS `bp-*` trong base.css) → GREEN; gỡ JSX stub khỏi tasks remote
- [x] T5 — Barrel `src/index.ts` + exports map (styles + ui) + README + ownership comments (`pnpm-workspace.yaml`, `fe-shared/package.json` description; `mfToolkit` nguyên vẹn)
- [x] T6 — Remotes `src/index.tsx` standalone (:4001/:4002) import tokens+base (fix "trơ trụi"; comment cho SF-3/4 banner)
- [x] T7 — Demo primitives sống: `docs/superpowers/designs/ui-redesign/ds-demo.html` (link CSS thật của fe-shared, markup = đúng DOM components render)
- [x] T8 — Verify: `pnpm build` ×3 + `pnpm test` (shell) + `typecheck` ×3 xanh; evidence `evidence/sf-1-ui-redesign-dsys/test-run.txt` (HEAD hash + `tdd: RED→GREEN`)
- [x] T9 — Browser verify 3 tầng (DOM / VISUAL so `b-reference.png` / FLOW shell→remote mount→đổi status) + ACCEPTANCE từng dòng; screenshots evidence
- [ ] T10 — Code-reviewer độc lập trên diff SF → verdict post Linear VU-54 (VERDICT + CHECKLIST-4Q)
- [ ] T11 — Commit atomic + push nhánh `wakii-dev/sf-1-ui-redesign-dsys` + `story-verify sf-1` sạch (B4 merge là phần coordinator) — KHÔNG set Done

## Exit criteria (ACCEPTANCE pack)

1. Standalone `:4001`/`:4002` có baseline style (không trơ trụi); primitives render đúng hand-off.
2. 3 package `pnpm build` xanh; spike R2 PASS có screenshot (console sạch duplicate-react).
3. `pnpm test` shell xanh kèm tests primitives.
4. `pnpm-lock.yaml` không đổi (0 deps mới).
5. Design gate: không re-design — implement thẳng hand-off (đã user-duyệt 2026-10-13).
