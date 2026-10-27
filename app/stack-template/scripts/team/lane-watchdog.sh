#!/usr/bin/env bash
# lane-watchdog.sh — tự nhắc tiến độ KHÔNG cần user (chạy nền cả phiên):
# mỗi 60s quét report mới/branch mới/PR mới → notification macOS + log.
# Coordinator (ZCode) đọc log này đầu mỗi vòng; user thấy notification.
LOG=/tmp/lane-watchdog.log
STATE=/tmp/lane-watchdog.state
touch "$STATE"
notify() { osascript -e "display notification \"$1\" with title \"🛠 Wakii lanes\"" 2>/dev/null; true; }
log() { echo "[$(date '+%H:%M:%S')] $1" >> "$LOG"; }
log "watchdog bắt đầu"
while true; do
  SNAP=$( (ls -l /tmp/worker-*-report.md 2>/dev/null; git -C /Users/hoivu/orca/architecture-overview for-each-ref --format='%(refname:short) %(objectname:short)' refs/heads/wakii-dev/ 2>/dev/null) | sort )
  if [ "$SNAP" != "$(cat "$STATE")" ]; then
    DIFF=$(diff <(cat "$STATE") <(echo "$SNAP") 2>/dev/null | grep '^>' | head -3)
    [ -n "$DIFF" ] && { MSG=$(echo "$DIFF" | sed 's/^> //' | tr '\n' ' ' | cut -c1-100); log "THAY ĐỔI: $MSG"; notify "$MSG"; }
    echo "$SNAP" > "$STATE"
  fi
  sleep 60
done
