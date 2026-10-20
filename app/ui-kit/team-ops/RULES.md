# RULES — Hiến pháp team @wakii/ui-kit (v1 — 2026-10-18, PO duyệt)
[ĐÃ THỐNG NHẤT — xem OPERATING-MODEL.md làm nguồn chính; file này giữ vai trò PHỤ LỤC luật R0-R12 chi tiết] Nguồn chân lý cho cách team vận hành. Xung đột với tài liệu khác → RULES thắng.
Sửa đổi: chỉ PO hoặc lead đề xuất + PO duyệt.


## R0. Nguyên tắc cốt lõi — TỐI ƯU NGUỒN LỰC = TỐI ƯU HIỆU SUẤT
### R0.1 KHÔNG NGHỈ (PO nhấn 2× trong phiên — luật cao nhất, override mọi kệ khác)
Bao giờ còn việc mở trong bảng nợ/queue: KHÔNG agent nào được idle quá 30s. Lead nhận alarm IDLE →
trong CÙNG chu kỳ phải: (1) phân công từ queue (2) chứng minh turn_started/spinner trong 60s
(3) không chứng minh được → gửi lại/interrupt NGAY, không chuyển việc khác. Vi phạm = lỗi nặng nhất.
Nghỉ chỉ hợp lệ khi: bảng nợ rỗng VÀ queue rỗng VÀ PO xác nhận chốt sóng.
Mọi quyết định của lead phải trả lời: "cái này có giữ 100% năng lực đội đang chạy không?"
- Không để member rảnh >1 chu kỳ watchdog (30s) — pool việc luôn sẵn.
- Mission đúng trọng lượng + đúng métier; việc nhỏ gộp batch, không chiếm agent.
- T2/T3 trust ladder: giảm chi phí điều phối mỗi turn (chuỗi tự chủ cho người đã chứng minh).
- Lead là tài nguyên đắt nhất: DECISIONS tiền-duyệt + peer-giải-quyết (như V1↔W6) + postman
  batch = tiết kiệm lead-attention cho gate & hướng đi.
- Context là tài nguyên: /clear khi ≥250k tokens; session chết = cứu WIP trong 1 chu kỳ.
Vi phạm R0 = vi phạm nặng nhất (dẫn tới mọi loại lệch khác).

## R1. Vai trò & quyền quyết định
| Quyền | Ai |
|---|---|
| Scope sản phẩm, merge PR, release, thêm/bớt người | **PO (user)** — không ai thay |
| Phán quyết kỹ thuật, gate, commit, phân công, giấy tờ team | **Lead** |
| Cách triển khai trong scope brief, đề xuất ý tưởng | **Worker** |
| Giải phóng mặt bằng: barrel/lockfile/package.json | chỉ Lead |
PO quyết trong ngày; Lead quyết trong 1 chu kỳ watchdog (30s); worker không chờ ai cho việc trong scope.

## R2. Vòng làm việc (bắt buộc mọi mission)
1. Brief phải đóng hộp: `Phạm vi: CHỈ <dir/file> — ngoài CẤM` + verify lệnh + điểm DỪNG.
2. Worker: làm → verify (paste số liệu thật) → BÁO CÁO → DỪNG chờ việc.
3. Lead: ACK ≤10s → gate độc lập (git diff + verify thật) → commit attribution → giao việc kế.
4. Không self-merge, không self-commit — trừ khi lead chỉ định rõ trong brief.

## R3. Thang tin cậy (tự chủ theo thành tích — giải quyết căng thẳng tốc-độ/kiểm-soát)
- **T1 Mới**: report từng mission, không tự chuyển.
- **T2 Đã ship ≥5 mission gate-sạch**: được nhận CHUỖI ≤3 mission brief đóng hộp, tự chuyển
  trong chuỗi, chỉ report ở cuối chuỗi hoặc khi blocker.
- **T3 ≥10 sạch**: được đề xuất mission (lead duyệt nhanh), review PR của peer.
Thăng/giáng: lead quyết dựa log board; T2+ mất quyền nếu 1 mission đỏ do lỗi own-scope.

## R4. Giao tiếp
- Peer cần peer → `docs/team/inbox/<tên>.md` (format `[HH:MM] @from → nội dung`); lead = bưu tá,
  giao thư trong chu kỳ ACK, KHÔNG gián đoạn turn đang chạy.
- Broadcast → `docs/team/CHANNEL.md`. Quyết định tiền-duyệt → `DECISIONS.md` (worker tự thi hành).
- Màn hình glitch → ghi `/tmp/<tên>-report.md`.
- Standing daily-standup: lead tổng hợp vào `TEAM.md` mỗi ~30' (đang-làm / vừa-ship / blocker).


### R4c. Chủ động báo lead (active-ping — bắt buộc từ 19-10 01:2x)
Mọi mission, worker ghi vào `docs/team/inbox/lead.md` theo mốc:
- `[HH:MM] @<tên> START <mission 1 dòng>`
- `[HH:MM] @<tên> MILESTONE <xong gì + số liệu 1 dòng>` (mỗi mốc đáng kể)
- `[HH:MM] @<tên> REPORT <tóm tắt cuối + verify paste>` (thay cho chờ prompt)
- `[HH:MM] @<tên> BLOCKED <symptom + đã thử>` (ngay khi kẹt, không âm thầm)
Lead phản hồi ACK/phán quyết vào inbox worker trong chu kỳ 30s. Mục đích: luồng giao tiếp
liên tục nhìn thấy được (PO mở inbox/lead.md là thấy cả team đang nói gì) — không chờ cuối turn.

### R4b. Hỗ trợ nhau (mutual aid — bắt buộc)
- Member block/quá tải → đăng HELP.md (1 dòng); KHÔNG âm thầm chết đứng.
- Member rảnh + pool không hợp métier → quét HELP.md TRƯỚC khi idle; đỡ teammate = việc chính đáng.
- Helper gửi diff-đề-xuất qua inbox (không edit file dirty người khác); owner áp + credit.
- Takeover cần owner đồng ý + lead duyệt trong 1 chu kỳ.
- Chia sẻ kiến thức: "mình vừa học được gì" (gotcha/shortcut) viết CHANNEL.md — biết hơn 1 lần, cả team dùng mãi.

## R5. Chất lượng
- Mọi commit qua gate: tests cụm xanh + tsc 0 + eslint 0-error (worker tự chạy + lead kiểm lại).
- PR lớn: ≥1 peer review trước merge (T3 reviewer).
- Story render: test-runner pass; visual: evidence screenshot khi đụng layout/motion.
- Không tin report suông — lead verify bằng diff thật (git = ground truth).

## R6. Sở hữu & va chạm
- 1 app-dir / 1 domain = 1 owner tại một thời điểm (bảng ownership trong TEAM.md).
- File dirty người khác → không đụng (P1); cần gấp → inbox nhắc owner.
- Bug ngoài scope: ≤10 dòng trong scope thì fix; quá → report. Test fail ngoài scope = WIP, bỏ qua.

## R7. Kỷ luật (dựa trên lỗi thật đã xảy ra)
- Brief mơ hồ phạm vi / ngồi trên quyết định / để agent rảnh quá 1 chu kỳ = lỗi LEAD, không lặp lại.
- Worker tự chuyển mission không được duyệt / tự commit / hex cứng / path relative = lỗi WORKER.
- Session chết: lead cứu WIP từ git trong chu kỳ kế; không spawn terminal mới khi PO cấm.

## R8. Quy mô & hiệu quả
- Two-pizza: ≤7 worker hoạt động song song; vượt → lead xếp serial theo sóng.
- Mục tiêu utilization ≥90% bận; phút-chờ <60s/turn; đo trong standup.
- Mission đúng trọng lượng: việc nặng cho métier đúng; việc nhỏ gộp batch, không chiếm 1 agent.

## R9. Nơi tài liệu sống
- Bản này: `docs/team/RULES.md` (local, gitignored — nội bộ). Bản tóm tắt cho session mới:
  CLAUDE.md section "Team protocol" (in-repo) + skills ui-kit-worker/pair-coding.
- Board: `TEAM.md` · Quyết định: `DECISIONS.md` · Thư: `inbox/` · Kênh: `CHANNEL.md`.

### R11. Template-Max bar (PO chỉ thị: "thể hiện càng nhiều khả năng càng tốt")
Mọi template showcase phải đạt: (1) 8-12 section nội dung thật (không placeholder) — dữ liệu
Orca-flavored (task/sprint/PR/worklog) (2) ≥1 live-state mạnh mỗi section: controlled form thật,
filter/sort hoạt động, drag thật, theme đổi live, toast thật (3) mật độ component cao — mỗi
template chạm ≥25 component khác nhau (4) motion đúng nghĩa (enter/stagger/hover/press, không
lòe loẹt vô nghĩa) (5) dark + light + reduced-motion đều đẹp (6) empty/loading/error state demo
ẩn hiện được (7) responsive 375→1440 không vỡ (8) evidence screenshots 2 chế.
