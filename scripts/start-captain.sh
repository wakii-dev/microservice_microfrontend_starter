#!/bin/sh
# Start Captain — one terminal, /goal loop, 3-minute checks
# Usage: ./scripts/start-captain.sh <repo-selector> [run-id]

REPO="${1:?Usage: start-captain.sh <repo-selector> [run-id]}"
RUN="${2:-$(cat ~/.wakii/current-run 2>/dev/null)}"

# Get repo worktree path
WT=$(orca worktree list --repo "$REPO" --json 2>/dev/null | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  try {
    const ws = JSON.parse(s).result.worktrees||[];
    const main = ws.find(w=>!w.path.includes('/orca/workspaces/')) || ws[0];
    console.log(main.id);
  } catch(e){ console.log('') }
})")

[ -z "$WT" ] && echo "❌ Cannot find worktree for $REPO" && exit 1

echo "── Creating Captain terminal (one terminal, no re-spawn) ──"
HANDLE=$(orca terminal create \
  --worktree "$WT" \
  --title "Captain" \
  --command "claude --dangerously-skip-permissions" \
  --json 2>/dev/null | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  try{console.log(JSON.parse(s).result.terminal.handle)}catch(e){console.log('')}
})")

[ -z "$HANDLE" ] && echo "❌ Failed to create terminal" && exit 1
echo "  Terminal: $HANDLE"

echo "── Waiting for TUI ready ──"
orca terminal wait --terminal "$HANDLE" --for tui-idle --timeout-ms 150000 --json > /dev/null 2>&1

echo "── Sending /goal (Captain loop) ──"
orca terminal send --terminal "$HANDLE" --enter --text "/goal all orchestration tasks are completed and merged. You are Captain (PM/coordinator). Read docs/superpowers/goal-state.md and docs/superpowers/team/ORCA-CHEATSHEET.md first. Then LOOP: 1) sleep 180 (3 minutes) 2) orca orchestration check --peek --json 3) If worker_done: verify evidence yourself, commit + merge, cleanup worktree, dispatch next task, post audit to Linear 4) If nothing: continue loop. STOP when orca orchestration task-list --json shows ALL tasks completed or failed. Or stop after 200 turns." --json > /dev/null 2>&1

echo ""
echo "✅ Captain started: $HANDLE"
echo "   Open Orca app → see 'Captain' terminal running /goal loop"
echo "   Check status: orca terminal read --terminal $HANDLE --limit 20"
