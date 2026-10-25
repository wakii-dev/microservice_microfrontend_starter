# create-wakii-stack

CLI scaffold **full-stack** (FE + BE) dùng @wakii/ui-kit — `pnpm create wakii-stack my-stack`. Chiến lược **Hybrid C**: copy full template rồi **prune theo manifest** (xoá paths + cắt khối compose + dọn depends_on + lọc gateway conf/env) — không template-engine, giữ nguyên nội dung gốc.

## Dùng

```bash
pnpm create wakii-stack my-stack                      # interactive (multiselect services)
pnpm create wakii-stack my-stack --all --yes          # mọi service, bỏ confirm
pnpm create wakii-stack stacks/billing --services node-svc,shell,tasks --skip-install
```

| Flag | Ý nghĩa | Default |
|---|---|---|
| `--services a,b` | Chọn services theo manifest | prompt multiselect |
| `--all` | Chọn mọi service | — |
| `--yes` | Bỏ confirm summary | — |
| `--skip-install` | Bỏ gợi ý install | — |

**Rules tầng 1** (tự áp theo manifest `layer`): ≥1 BE ⇒ kèm `postgres + kafka + gateway + auth-svc`; ≥1 FE ⇒ kèm `gateway`; chọn rỗng ⇒ lỗi.

## Kiến trúc

- `src/manifest.ts` — load + validate `stack-manifest.json` (schema JSDoc ngay trong file: services/layer/paths/envKeys/gatewayBlocks + files + ports + smoke). **Hợp đồng với worker-compose** — engine chỉ biết schema, không hardcode service.
- `src/options.ts` — parse flags + rules tầng 1
- `src/scaffold.ts` — full-copy → render `__STACK_NAME__`/`__STACK_ORG__` (binary bỏ qua) → prune paths/compose (text indentation-based: block 2-space, depends_on entry 6-space + dọn tham chiếu + bỏ pgdata + warning comment)/gateway conf (brace-count theo marker)/env keys → sinh README
- `src/index.ts` — flow `@clack/prompts`

## Phát triển

```bash
pnpm --filter create-wakii-stack typecheck
pnpm --filter create-wakii-stack test   # fixture template 3 services giả trong tmp — không network
```
