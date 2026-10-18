# Team Board — @wakii/ui-kit (VU-53)

Team vận hành: **Product Owner** (user) · **Team Lead** ZCode (coordinator) · **Workers** Claude terminals.
Quy tắc: worker xong → verify → REPORT (log vào đây) → DỪNG chờ lead. Lead ACK trong ~10s → gate → giao việc kế. Standup mỗi ~30 phút.

## Roster

| Thành viên | Terminal | Métier |
|---|---|---|
| Lead ZCode | ca55a77c | điều phối, gate, commit, PR, infra :6006 |
| D | 8703af29 | overlay + docs + QA mắt |
| W6 | 16353b37 | forms + table + data |
| W7 | 4bdd09e8 | layout + dashboard |
| W8 | d35c98a4 | motion + visual polish |
| V1 | c3fb9a45 | storybook sweep + mobile |
| V2 | 9044c29b | style sweep + audit + auth |
| W9 | (đã hy sinh 19:0x) | drag-drop/kanban — work saved by lead |

## Standup log (mới nhất trên đầu)

### 20:02 — Lead
- SHIPPED: tree-table+layout `b73d2e6` · templates dashboard/kanban `3a55922` · docs motion `26bfceb` · auth template `417f089` · README templates `0c302d8` → PR #55 ~62 commits
- ĐANG: W6 table-advanced+CRUD · W7 Settings template · W8 Landing · D release-notes-0.3.0 · V1 mopup-report (glitch màn hình, đã xin ghi /tmp) · V2 mega-gate prep
- BLOCKER: màn hình V1 glitch (dùng file report thay thế) · W9 chết session (việc đã chia lại)
- NEXT: gate CRUD+Settings+Landing → mega-gate → release notes → 0.3.0 chờ PO

## Report log

| Giờ | Ai | Nội dung | Lead ACK | Gate |
|---|---|---|---|---|
| 19:55 | W8 | docs motion family (rows+recipe+changelog) | ✓ | ✓ `26bfceb` |
| 19:57 | V2 | Auth template + useForm polish (12m59s, visual 3/3) | ✓ | ✓ `417f089` |
| 20:00 | V1 | mopup test-storybook (report bị glitch — xin ghi file) | ✓ | pending |
| 20:01 | D | README templates + AGENTS rows | ✓ | ✓ `0c302d8` |
