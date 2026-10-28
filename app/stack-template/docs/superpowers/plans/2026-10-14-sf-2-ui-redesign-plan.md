# Plan — SF-2 Shell: layout, login, nav, remote fallback (VU-55, story VU-53 UI redesign)

> Tier: Standard. Spec: `docs/superpowers/contexts/ui-redesign/sf-2.md` + hand-off
> `docs/superpowers/designs/ui-redesign-direction.md` (§4 App chrome/Login card áp shell;
> visual tham chiếu `drafts/b-reference.html` — mâu thuẫn nhỏ resolved: nav active dùng
> gạch `--accent` 2px dưới theo hand-off §4 vì .wakii quy định "restyle theo hand-off",
> brand mark/user chip/ghost logout lấy từ reference).
> Worktree: `sf-2-ui-redesign-shell` (story-hub model — push nhánh, coordinator merge).
> Cứng: `pnpm-lock.yaml` KHÔNG đổi; `frontend/shared/**`, `frontend/remotes/**` READ-ONLY;
> a11y 3 test case NGUYÊN VẸN; text contracts giữ (login errors, "Thử lại", headings,
> skip-link, `data-testid="nav-user"`, `aria-label="Điều hướng chính"`).

## Tasks

- [x] T1 — TDD RED: thêm tests shell mới trước (nav active `aria-current="page"`, HomePage quick links + demo hints, login card cấu trúc) — chạy FAIL trước khi implement
- [x] T2 — `bootstrap.tsx`: import chain `@boilerplate/fe-shared/styles/tokens.css` + `base.css` LÀM CHỦ global rồi `./styles.css` (unlayered scoped thắng base theo kiến trúc `@layer`)
- [x] T3 — `styles.css` rewrite scoped `sh-*` (topbar/nav/chip/avatar/login card/home cards/remote fallback/error banner usage); 0 element selector toàn cục; chỉ tokens; media ≤768px wrap
- [x] T4 — `NavBar.tsx`: NavLink active (`aria-current="page"` + gạch accent) + brand mark + user chip (avatar chữ cái đầu nền accent@15% + email `--fs-meta`) + logout ghost / login link; giữ contracts
- [x] T5 — `Layout.tsx`: className container/main only — skip-link text + href, `main#main-content` tabIndex, focus-on-route logic NGUYÊN VẸN
- [x] T6 — `LoginPage.tsx`: card giữa màn hình (`--c-s2` `--r-3` viền `--line` padding `--sp-6`) + wordmark "Boilerplate" + heading "Đăng nhập" (giữ role heading cho test) + hint demo mono đẹp (alice + fail@demo.local saga); behavior + error messages + redirect/deep-link GIỮ
- [x] T7 — `HomePage.tsx`: dashboard chào + quick links 2 remote (cards Tokens) + demo hints (alice@demo.local / demo-password; fail@demo.local saga) — giữ h1 "Trang chủ"
- [x] T8 — `RemoteSlot.tsx`: Suspense fallback = `Skeleton` primitive (bỏ `<p>Đang tải…</p>` — không test assert chuỗi này); error fallback visual giữ text "Không tải được phần …" + nút "Thử lại"
- [x] T9 — Verify: `pnpm test` + `pnpm typecheck` shell xanh (a11y 3 case nguyên vẹn); browser verify 3 tầng (DOM eval / VISUAL so `b-reference.png` / FLOW login→nav active→dashboard→remote-fallback qua SHELL_PORT=3100, remote-down simulate port chết — KHÔNG kill container docker chung) + screenshots evidence
- [x] T10 — Code-reviewer độc lập trên diff SF → verdict post Linear VU-55 (VERDICT + CHECKLIST-4Q); CHANGES-REQUESTED → fix → re-review tới APPROVED
- [x] T11 — Evidence `evidence/sf-2-ui-redesign-shell/test-run.txt` (HEAD hash + `tdd:` line) + plan tick + commit atomic + push `wakii-dev/sf-2-ui-redesign-shell` + `story-verify sf-2` sạch (B4 merge/B5 Done là phần coordinator) — KHÔNG set Done

## Exit criteria (ACCEPTANCE pack)

1. Qua gateway :8080 hoặc dev :3100: login card đẹp giữa màn hình + hint đọc được; sau login nav hiện email chip + trang đang đứng active; HomePage dashboard có quick links Tasks/Activity + hint saga.
2. ≤768px: nav wrap, không overflow ngang.
3. Remote down: slot skeleton lúc tải + fallback đẹp nút "Thử lại" hoạt động.
4. `pnpm test` + `pnpm typecheck` shell xanh; 3 test a11y pass nguyên vẹn; 0 deps mới (lockfile không đổi).
