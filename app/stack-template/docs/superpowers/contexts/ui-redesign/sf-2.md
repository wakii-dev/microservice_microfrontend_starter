# SF-2 Context Pack — Shell: layout + login + nav + remote fallback
> Đọc file này THAY VÌ tự tổng hợp. Epic spec: `docs/superpowers/specs/2026-10-13-ui-redesign.md` (rev 3). Mindmap: `docs/superpowers/mindmaps/ui-redesign.wakii`.
> Depends: SF-1 (tokens + primitives + hand-off doc đã merge). WHY: shell là khung mọi trang — layout/nav/login là thứ user nhìn đầu tiên sau login gate; hiện nav không active state, HomePage trống, login form trơ.

## Spec slice (chỉ phần SF-2 chịu trách nhiệm)
1. Layout: container max-width + header/page structure theo direction đã chọn (`docs/superpowers/designs/ui-redesign-direction.md`). **Giữ NGUYÊN VẸN**: skip link text "Tới nội dung chính" + `href="#main-content"`, `main id="main-content" tabIndex={-1}`, focus main khi đổi route (`frontend/shell/src/components/Layout.tsx:14-27`).
2. NavBar active state: `aria-current="page"` + visual theo tokens; responsive wrap ≤768px (hiện flex không wrap → overflow mobile).
3. NavBar user chip + logout/login styling — giữ `data-testid="nav-user"` + aria-label "Điều hướng chính".
4. HomePage: dashboard chào + quick links 2 remote + demo hints (alice@demo.local / demo-password, fail@demo.local cho saga) — thay `<h1>Trang chủ</h1>` 8 dòng hiện tại.
5. LoginPage: card giữa màn hình + error banner styling + demo hint format đẹp — behavior GIỮ (redirect khi có token, deep-link `location.state.from`, error messages nguyên văn "Email hoặc mật khẩu không đúng." / "Không kết nối được máy chủ đăng nhập.").
6. RemoteSlot: Suspense fallback = `Skeleton` primitive (thay `<p>Đang tải {name}…</p>` — không test nào assert chuỗi này); error fallback visual — GIỮ text "Không tải được phần tasks…" + nút "Thử lại" (test contract).
7. `frontend/shell/src/styles.css` rewrite → scoped classes + consume tokens từ fe-shared; xóa element selectors toàn cục (body/nav/form/label/button — đã chuyển vào base.css của SF-1). Shell import base+tokens LÀM CHỦ global (bootstrap.tsx).
8. Tests tách theo surface: a11y 3 case giữ nguyên vẹn (hard gate) / login / remote-slot / integration — update chuỗi nếu UI đổi text (quy tắc cùng-commit cùng-SF).
9. Diff-hygiene cuối SF: diff không chứa secrets, không exec-bit mới (phase-gate security Phase 1).

## Interface contract (với SF-1 output)
- Import: `@boilerplate/fe-shared` → `Skeleton`, tokens qua CSS (`tokens.css` vars theo hand-off doc). Props API từng primitive = mục hand-off "component spec" — DÙNG ĐÚNG SHAPE, không tự chế props.
- Cần variant primitive chưa có trong hand-off? **FLAG coordinator** — fe-shared đã đóng băng sau SF-1, không tự sửa.

## Touch map (files SF-2 tạo/sở hữu)
```
frontend/shell/src/styles.css              [SỞ HỮU — rewrite]
frontend/shell/src/bootstrap.tsx           [SỬA — import chain]
frontend/shell/src/components/Layout.tsx   [SỬA — className only, KHÔNG đụng focus logic]
frontend/shell/src/components/NavBar.tsx   [SỬA — aria-current + styling]
frontend/shell/src/components/RemoteSlot.tsx [SỬA — fallback visuals]
frontend/shell/src/pages/{HomePage,LoginPage}.tsx [SỬA]
frontend/shell/tests/*                     [SỬA — update + giữ a11y 3 case]
frontend/remotes/**, frontend/shared/**    [READ-ONLY toàn bộ]
rspack.config.mjs / env.d.ts               [READ-ONLY — SF-1 đã xong config]
contracts/**, platform/**, services/**, scripts/** [READ-ONLY]
```

## ACCEPTANCE (user-visible)
- Qua gateway :8080 (hoặc dev :3000): login form card đẹp giữa màn hình, hint demo đọc được; sau login nav hiện email chip + trang đang đứng được đánh dấu active; HomePage dashboard có quick links Tasks/Activity + hint saga.
- Thu hẹp cửa sổ ≤768px: nav wrap, không overflow ngang.
- Kill remote dev server → reload: slot hiện skeleton lúc tải + fallback đẹp có nút "Thử lại" hoạt động (walkthrough mục 4.4).
- `pnpm test` + `pnpm typecheck` shell xanh; 3 test a11y pass nguyên vẹn.

## Boundary (KHÔNG làm)
- KHÔNG đụng frontend/remotes/** (SF-3/4) và frontend/shared/** (đóng băng sau SF-1).
- KHÔNG đổi RemoteSlot text contract ("Không tải được phần tasks…" / "Thử lại"), KHÔNG đổi error messages login, KHÔNG bỏ skip-link/focus logic.
- KHÔNG thêm tokens/primitives mới (flag coordinator nếu cần).
- KHÔNG merge vào main / KHÔNG tạo PR (coordinator làm).
