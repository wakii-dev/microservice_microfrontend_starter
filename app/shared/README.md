# @wakii/fe-shared — logic FE dùng chung

4 file **logic** consumed qua source bởi shell + 2 remotes: `api-client` (ApiClient +
timeout/envelope), `token-storage` (JWT storage + claims), `error-envelope` (decode
chuẩn conventions/04), `mf-bootstrap` (MF runtime helper — loadRemoteModule/retry).

> **Design system KHÔNG còn ở đây** — tách sang [`@wakii/ui-kit`](../ui-kit) 2026-10-17
> (ADR-0009): tokens/base css + primitives Badge/EmptyState/Skeleton/Spinner + Storybook.

## READ-LOCKED

Cả 4 file `src/*.ts` + `package.json#mfToolkit` **cấm sửa ngoài epic được duyệt** —
versions đã test thật (spike SF-1: MF host :3000 load remote :4001, evidence
`docs/superpowers/evidence/sf-1-mf-spike-host.png`). Nâng cấp react/rspack/@module-federation
= re-spike qua `app/spike` trước. Chi tiết: CLAUDE.md + `package.json#mfToolkit.$comment`.

## Standalone-copy

Remote/shell copy KÈM package này (Dockerfile COPY đủ importer); fe-shared khai
`catalog:` → standalone cần mini workspace (mẫu: `.github/workflows/convergence.yml`
step copy-dir). Typecheck standalone = flags CLI, không tsconfig trong package.
