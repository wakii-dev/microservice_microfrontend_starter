# SF-5 Context Pack — FE shell (MF host)
> Đọc file này THAY VÌ tự tổng hợp từ bracket + epic + comments.
> Epic spec: `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` (rev 3). Bracket: `docs/superpowers/mindmaps/micro-boilerplate.wakii`.

## Spec slice (chỉ phần SF-5 chịu trách nhiệm)
1. Scaffold `frontend/shell/`: Rspack + @module-federation/enhanced HOST, React 19, TypeScript, pnpm.
2. **Task đầu: re-validation spike SF-1 + fe-shared fit-check** — pin versions của SF-1 còn đúng không; export API của `frontend/shared` đủ dùng cho shell chưa. Lệch phát hiện NGAY, không giữa run.
3. pnpm catalog ép singleton deps (react, react-dom, react-router) — shell KHÔNG bundle duplicate.
4. Routing + layout + nav: route cho `/` (home), `/tasks`, `/activity` (2 route sau load remote theo remote registry); layout khung chung.
5. Login: dùng token-storage + api client từ `frontend/shared` (READ-ONLY); login form gọi auth-mock qua gateway `/api/auth/login`; JWT lưu; mọi api call đính Authorization.
6. a11y baseline CÓ TEST: route focus management + skip link — vitest assert.
7. Error boundary + fallback UI khi remote load fail (remote down không trắng trang — hiện thông báo + retry).
8. Tests vitest + testing-library.
9. Dockerfile (nginx serve static).
10. **Boot-smoke CI job** cho shell static (up + trả 200).
11. Compose entry PRE-SEED — KHÔNG sửa `platform/docker-compose.yml`.
12. README.md trong `frontend/shell/`. Exit: docs đủ (copy-dir proof là SF-7, copy KÈM `frontend/shared`).

## Touch map (files SF-5 tạo/sở hữu)
```
frontend/shell/**                [SỞ HỮU]
frontend/shared/**               [READ-ONLY — SF-1 sở hữu; fit-check thấy thiếu = FLAG, KHÔNG tự sửa]
pnpm-workspace.yaml / catalog    [READ-ONLY — SF-1]
platform/docker-compose.yml      [READ-ONLY]
platform/conventions/*           [READ-ONLY — port table, routing table, remote registry]
.env.example                     [READ-ONLY]
pnpm-lock.yaml                   [SF-5 và SF-6 CÙNG regenerate — coordinator resolve: lấy 1 phía + pnpm install lại]
```

## ACCEPTANCE (user-visible)
- Chạy shell dev server (native) → login bằng fixture user → thấy nav + layout; route tasks/activity hiện fallback remote-down (vì remote chưa có lúc SF-5 standalone).
- Remote thật (SF-6) load được vào layout — chứng minh ở SF-6/SF-7, SF-5 chỉ cần host-side sẵn.
- Remote down → error boundary hiện thông báo, không crash.
- Vitest pass: route focus + skip link + login flow (mocked api).
- CI xanh: build + tests + boot-smoke.

## Boundary (KHÔNG làm)
- KHÔNG implement remote apps (SF-6).
- KHÔNG sửa fe-shared/catalog/compose/contracts (đụng = flag).
- KHÔNG dựng UI design system phức tạp — boilerplate là khung tối giản, sạch, dễ thay.
- KHÔNG thử docker local — CI verify.
