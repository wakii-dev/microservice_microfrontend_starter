# frontend/spike — MF/Rspack spike (SF-1)

Mục đích: chứng minh **React 19 + @module-federation/enhanced + Rspack** load được host → remote, để **pin version có căn cứ** (không bịa) trước khi SF-5/6 build shell/remotes thật. Xoá/sửa được sau khi SF-5 re-validate — KHÔNG phải production code.

## Kết quả — ĐÃ TEST THẬT 2026-10-12

- ✅ Host (`:3000`) dynamic-import được exposed module `./Hello` từ remote (`:4001/remoteEntry.js`).
- ✅ Evidence: `docs/superpowers/evidence/sf-1-mf-spike-host.png` (screenshot browser thật).
- Versions pin: trường `mfToolkit.pinned` trong `frontend/shared/package.json` — react 19.3.0, react-dom 19.3.0, @rspack/core + @rspack/cli 1.7.12, @module-federation/enhanced 0.21.6.

## Learned (2 pitfall — SF-5/6 tránh lặp)

1. **Host entry cần async boundary**: entry chỉ được `import('./bootstrap.jsx')` — KHÔNG import shared dep (react/react-dom) tĩnh ở entry, ngược lại lỗi `Invalid loadShareSync function call from runtime #RUNTIME-006`.
2. **JSX automatic runtime**: `builtin:swc-loader` phải set `jsc.transform.react.runtime = 'automatic'` — classic runtime biên dịch `React.createElement` mà không tự import React → `React is not defined`.

## Chạy lại spike

```bash
# từ root repo (workspace đã include frontend/spike/*)
pnpm install
cd frontend/spike/remote && pnpm build   # dist + remoteEntry.js
cd ../host && pnpm build && cp index.html dist/
# serve 2 dist (0-dep server kèm sẵn, CORS mở):
cd .. && node serve.mjs remote/dist 4001 &
node serve.mjs host/dist 3000 &
# mở http://localhost:3000/index.html → thấy "✅ Hello from spike_remote"
```

## Cấu trúc

```
remote/  — MF remote, expose ./Hello, remoteEntry.js trên :4001
host/    — MF host, dynamic import('spike_remote/Hello'), trang trên :3000
serve.mjs— static server 0-dep (CORS *) cho 2 dist
```
