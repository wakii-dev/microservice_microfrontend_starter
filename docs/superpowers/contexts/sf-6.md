# SF-6 Context Pack — FE remotes (tasks + activity)
> Đọc file này THAY VÌ tự tổng hợp từ bracket + epic + comments.
> Epic spec: `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` (rev 3). Bracket: `docs/superpowers/mindmaps/micro-boilerplate.wakii`.

## Spec slice (chỉ phần SF-6 chịu trách nhiệm)
1. Scaffold 2 remote apps: `frontend/remotes/tasks/`, `frontend/remotes/activity/` — Rspack + @module-federation/enhanced REMOTE, cùng pattern.
2. Remote URLs đọc từ remote registry (env-configurable); dev server proxy theo conventions (native mode không cần CORS mở).
3. Remote `tasks`: danh sách + tạo/sửa task — gọi node-svc qua gateway `/api/tasks`, đính JWT (api client từ fe-shared); error envelope decode → toast/inline error.
4. Remote `activity`: feed + stats — gọi go-svc qua gateway `/api/activity`; render user-display fields (userName, taskTitle) từ response.
5. Shared singletons theo catalog (react/react-dom/router KHÔNG duplicate — expose + shared config đúng MF 2.0).
6. Mỗi remote: vitest tests (component + api call mocked), Dockerfile nginx static, **boot-smoke CI job** (up + trả 200 + remoteEntry.js fetch được), compose impl điền vào entry pre-seed, README.md standalone (copy KÈM `frontend/shared`).
7. Lưu ý vận hành: SF-5 đang song song regenerate `pnpm-lock.yaml` — khi merge coordinator xử lý theo checklist (lấy 1 phía + `pnpm install` lại); SF-6 commit lockfile của mình bình thường.

## Touch map (files SF-6 tạo/sở hữu)
```
frontend/remotes/tasks/**        [SỞ HỮU]
frontend/remotes/activity/**     [SỞ HỮU]
frontend/shared/**               [READ-ONLY — SF-1; thiếu = FLAG]
frontend/shell/**                [READ-ONLY — SF-5; host phải expose remote slots, nếu thiếu slot = FLAG]
pnpm-workspace.yaml / catalog    [READ-ONLY]
platform/docker-compose.yml      [READ-ONLY — impl điền vào entry pre-seed]
platform/conventions/*           [READ-ONLY]
pnpm-lock.yaml                   [chung với SF-5 — coordinator resolve khi merge]
```

## ACCEPTANCE (user-visible)
- Chạy shell (SF-5) + 2 remote dev servers → login → route `/tasks`: tạo task mới → hiện trong danh sách (đi qua node-svc THẬT qua gateway); route `/activity`: feed/stats phản ánh task vừa tạo (go-svc thật).
- 1 remote down → shell vẫn chạy, remote còn lại hoạt động.
- Vitest pass cho cả 2 remote.
- CI xanh: build + tests + boot-smoke per remote (remoteEntry fetch được).

## Boundary (KHÔNG làm)
- KHÔNG sửa shell/fe-shared/catalog/compose/contracts (đụng = flag).
- KHÔNG implement service-side (SF-2/3/4 sở hữu).
- KHÔNG thêm remote thứ 3 — chỉ tasks + activity.
- KHÔNG thử docker local — CI verify.
