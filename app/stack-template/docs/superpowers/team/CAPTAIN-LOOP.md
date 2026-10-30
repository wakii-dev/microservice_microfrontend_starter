# Captain Agent Loop — 3 Implementation Levels

## Phương án 1: BACKGROUND TASK CHAIN (Zcode — hiện tại)

**Nguyên lý:** Mỗi turn kết thúc bằng MỘT background task. Khi nó exit → Zcode dậy → làm việc → arm task mới → ngủ.

```bash
# ═══ CÀI ĐẶT: dòng CUỐI CÙNG của MỌI turn ═══
orca orchestration check \
  --run $(cat ~/.wakii/current-run) \
  --wait --types worker_done,escalation,question \
  --timeout-ms 480000 \
  --json
# → run_in_background: true
```

**Pseudocode:**
```
TURN:
  read goal-state.md
  messages = check --run <RUN> --peek
  for each worker_done in messages:
    result = verifyEvidence(worker)      # tự chạy DoD
    if result.pass:
      merge(worker)                      # commit + merge + cleanup
      dispatchNext()                     # task kế theo DAG
    else:
      reDispatch(worker, attempt++)      # ledger ≤3
  arm check --wait (background)          # ← ĐIỂM YẾU: phải NHỚ
  end turn
```

**Giới hạn:** Quên re-arm 1 lần = loop đứt. Đã xảy ra 3 lần.

---

## Phương án 2: START-OF-TURN AUTO-HEAL (Zcode + safety net)

**Nguyên lý:** Thêm safety net — đầu MỌI turn, kiểm tra xem có background task đang chạy không. Nếu không → arm ngay.

```bash
# ═══ ĐẦU MỌI TURN (trước mọi việc khác) ═══
HAS_WATCHER=$(ps aux | grep "check.*--wait" | grep -v grep | wc -l)
if [ "$HAS_WATCHER" -eq 0 ]; then
  echo "⚠️ Không có watcher — arm ngay"
  # Arm background task
  orca orchestration check \
    --run $(cat ~/.wakii/current-run) \
    --wait --types worker_done,escalation,question \
    --timeout-ms 480000 --json &
fi
```

**Pseudocode:**
```
TURN:
  if no_background_task_running:      # safety net
    arm check --wait (background)    # auto-heal
  read goal-state.md
  ... (same as Phương án 1)
  arm check --wait (background)      # normal arm
  end turn
```

**Cải thiện:** Nếu quên re-arm ở cuối turn, lần dậy kế (từ user message) sẽ tự heal. Nhưng giữa 2 lần dậy vẫn có gap.

---

## Phương án 3: DEDICATED CAPTAIN TERMINAL (Claude Code 24/7)

**Nguyên lý:** Thay vì Zcode làm Captain directly, chạy MỘT Claude Code agent trong Orca terminal làm Captain 24/7. Zcode trở thành "relay" giữa user và Captain.

```bash
# ═══ CÀI ĐẶT MỘT LẦN ═══

# 1. Tạo Captain terminal
CAPTAIN=$(orca terminal create \
  --worktree <main-worktree> \
  --title "Captain" \
  --command "claude --dangerously-skip-permissions" \
  --json | jq -r '.result.terminal.handle')

# 2. Đợi TUI sẵn sàng
orca terminal wait --terminal "$CAPTAIN" --for tui-idle --timeout-ms 150000

# 3. Gửi Captain loop prompt
orca terminal send --terminal "$CAPTAIN" --enter --text "
You are Captain — the PM/coordinator for this project.
Read docs/superpowers/team/TEAM-WORKFLOW.md first.
Then run this loop CONTINUOUSLY:

1. Check for worker completions:
   orca orchestration check --run <RUN> --wait --types worker_done --timeout-ms 60000
2. For each completion: verify evidence (run DoD yourself)
3. If pass: merge to main + cleanup worktree + dispatch next task
4. If fail: re-dispatch (max 3 attempts)
5. Update goal-state.md
6. Post audit to Linear
7. Repeat from step 1

Stop ONLY when: all tasks completed AND no more to dispatch.
When stopping, print: ALL_DONE <summary>
"
```

**Architecture:**
```
User (CEO)
  ↓ "Hey Captain, status?"
Zcode (Relay — đọc Captain terminal + relay cho user)
  ↓
Claude Code Captain (24/7 trong Orca terminal — TRUE agent loop)
  ↓ orchestration commands
Workers (Smith, Weaver, etc. trong worktrees)
```

**Ưu điểm:** TRUE continuous loop — Claude Code chạy không cần re-arm, tự duy trì.
**Nhược điểm:** Captain là Claude Code (không phải Zcode) — không có Zcode tools (Skill, Agent spawn).

---

## So sánh

| | P1: Background chain | P2: Auto-heal | P3: Dedicated terminal |
|---|---|---|---|
| **Continuous?** | ⚠️ Gap tối đa 8 phút | ⚠️ Gap đến lần dậy kế | ✅ 24/7 |
| **Quên được?** | ❌ Phải nhớ re-arm | ⚠️ Self-heal nếu dậy | ✅ Không cần nhớ |
| **Zcode tools** | ✅ Full | ✅ Full | ❌ Chỉ Claude Code tools |
| **Setup** | Có sẵn | Có sẵn | Cần 1 terminal |
| **Độ phức tạp** | Thấp | Trung bình | Cao |
| **Phù hợp** | Batch tasks | Semi-continuous | Full continuous |

## Khuyến nghị

- **Ngay bây giờ:** Dùng P2 (auto-heal) — cải thiện P1 với safety net
- **Khi cần 24/7:** Chuyển sang P3 (dedicated Captain terminal)
- **P3 là đích:** Captain = Claude Code agent 24/7, Zcode = relay/interface cho user
