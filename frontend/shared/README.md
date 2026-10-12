# @boilerplate/fe-shared (fe-shared)

Repo-con thứ 7. **SF-1 sở hữu — SF-5/6 READ-ONLY** (đụng = flag coordinator). Shell/remotes copy đi nơi khác phải KÈM package này (standalone-copy definition, epic spec §SF-6).

## Nội dung

| Module | Chức năng |
|--------|-----------|
| `api-client` | Fetch wrapper: đính JWT (`Authorization: Bearer`) + decode error envelope (conventions/04) → throw `ApiError{status, code, requestId}` |
| `token-storage` | Lưu/đọc JWT (localStorage, memory fallback) + `readClaims` (KHÔNG verify — verify là việc service) + `isExpired` (TTL 8h) |
| `error-envelope` | Types + `decodeErrorEnvelope` |
| `mf-bootstrap` | Load remote helper + remote registry resolution (URL từ env — conventions/08) |

## MF toolkit pin (kết quả spike SF-1)

Trường `mfToolkit.pinned` trong `package.json` = versions **đã test thật** (host load được remote trên Rspack, React 19). Spike: `frontend/spike/`. SF-5/6 dùng đúng matrix; nâng version = re-spike trước.

React 19 + Module Federation + Rspack là cặp rủi ro (repo đổi bundler internals) — KHÔNG nâng một mình một thành phần.
