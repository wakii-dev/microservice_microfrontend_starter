# generators — `pnpm gen:service | gen:app | gen:feature`

Sinh khung ĐÚNG conventions (platform/conventions/01–09) cho AI & người. 1 lệnh = service/app/feature mới + mọi chỗ chèn kèm (compose · gateway nginx · .env.example · pnpm-workspace · bảng port · contracts stub · CI workflow).

## Output contract (AI-first)

`--json` → `{created: string[], modified: string[], next_steps: string[]}` — `next_steps` là directives AI thực hiện được (verb-first + path + hành động). Mặc định text: mỗi dòng `created:/modified:/next:`. Lỗi → stderr `error: ...` (hoặc `{"error":{"message}}` khi --json), exit 1. Idempotent-guard: thứ tồn tại → lỗi, KHÔNG bao giờ đè.

## Lệnh

```bash
pnpm gen:service <tên> [--lang ts|go|spring] [--port N] [--db]   # services/<tên>/ + chèn infra
pnpm gen:app <tên> [--remote] [--port N]                         # app/<tên> SPA | app/remotes/<tên> MF remote
pnpm gen:feature <tên> --app <app>                               # Page + api + test + route trong app có sẵn
```

| Generator | Sinh files | Chèn vào |
|---|---|---|
| `gen:service` (ts mặc định) | `services/<tên>/` Fastify TS: app.ts (envelope 04 + CORS 07), routes/health (02 naked+mirror), routes/items (SAMPLE), env fail-fast 06, logger 03, auth JWT (08 rule 4), Dockerfile 01, test, README; go = chi; spring = Boot 3 | compose (yaml pkg), nginx (`# GEN:services` marker), .env.example, pnpm-workspace (ts), conventions/05 bảng port, `contracts/openapi/<tên>.yaml` stub (spectral-pass), `.github/workflows/services-<tên>.yml` |
| `gen:app` | SPA: Vite + ui-kit Layout + dark toggle (pattern app/admin). `--remote`: MF remote 2-entry + rspack + nginx.conf + Dockerfile (pattern remotes/tasks) | `--remote`: compose `remote-<tên>` (port trống 4003+), nginx map `$remote_up` (`# GEN:remotes`), .env `REMOTE_*`, conventions/05 |
| `gen:feature` | `src/pages/<Pascal>Page.tsx` (Card+Table+Alert), `src/api/<tên>.ts` (decode envelope 04), smoke test, FEATURE.md | Route vào `src/App.tsx` (marker `GEN:routes` → fallback trước catch-all `path="*"`) hoặc exposes vào `rspack.config.mjs` của remote; không chắc anchor → next_steps hướng dẫn tay |

Chọn port: quét compose (host+container) — service BE 3002+ · FE remote 4003+ · SPA dev 5174+. `--port` override (bị chiếm → lỗi).

## Dev generator

```bash
node --test scripts/generators/lib/insert.test.mjs   # unit test hàm chèn (node:test, 0 deps — chỉ nhận ĐƯỜNG DẪN FILE, dir arg không chạy trên node 24)
node scripts/generators/gen-service.mjs --help       # usage từng generator
```

Test generator THẬT phải trong fixture `/tmp` (KHÔNG chạy generator lên repo này):

```bash
mkdir -p /tmp/fx/platform/gateway/nginx /tmp/fx/contracts/openapi /tmp/fx/platform/conventions
cp platform/docker-compose.yml platform/.env.example /tmp/fx/platform/
cp platform/gateway/nginx/nginx.conf /tmp/fx/platform/gateway/nginx/
cp pnpm-workspace.yaml /tmp/fx/ && cp platform/conventions/05-ports.md /tmp/fx/platform/conventions/ && cp .spectral.yaml /tmp/fx/
node scripts/generators/gen-service.mjs demo-svc --root /tmp/fx --json
docker compose -f /tmp/fx/platform/docker-compose.yml --env-file /tmp/fx/platform/.env.example config -q
pnpm exec spectral lint --ruleset /tmp/fx/.spectral.yaml /tmp/fx/contracts/openapi/demo-svc.yaml
```

## Chi tiết kỹ thuật

- **Chèn compose** bằng pkg `yaml` Document API (comment/formatting giữ nguyên, `lineWidth: 0` — không reflow dòng dài có sẵn). KHÔNG regex tay.
- **Chèn nginx** bằng marker `# >>> GEN:services|remotes` quanh anchor ổn định của conf (lần chạy đầu TẠO marker; lần sau chèn trong vùng).
- **Chèn `.env.example`** append section cuối (review dễ thấy); key có sẵn → bỏ qua.
- Scope files generator được phép ĐỘNG: chỉ THÊM files mới + chèn vào 5 file infra ở trên. App/service có sẵn KHÔNG bị sửa (trừ route/expose khi gen:feature — đúng anchor mới chèn).
- Port/MF pins READ-LOCKED (conventions/05, mfToolkit): template KHÔNG tự nâng version — nâng cấp = re-spike.
