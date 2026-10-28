#!/usr/bin/env bash
# lanes-status.sh — BẢNG TỔNG HỢP tiến độ 1 lệnh (coordinator chạy mỗi vòng poll)
# Nguồn: orca terminals + /tmp/worker-*-report.md + git branches mới commit + PR open
echo "═══════════ WORKER LANES — $(date '+%H:%M:%S') ═══════════"
echo "── Terminal sessions (Claude workers):"
orca terminal list 2>/dev/null | grep -E "^term_" | sed 's/  connected.*//;s/^/  /' | head -12
echo "── Reports mới nhất (/tmp/worker-*-report.md):"
for f in /tmp/worker-*-report.md; do
  [ -f "$f" ] && printf "  %-42s %s\n" "$(basename "$f")" "$(stat -f '%Sm' -t '%d/%m %H:%M' "$f")"
done | sort -k2
echo "── Branch có commit chưa merge vào origin/main:"
for b in $(git for-each-ref --format='%(refname:short)' refs/heads/wakii-dev/ 2>/dev/null); do
  N=$(git rev-list --count "origin/main..$b" 2>/dev/null)
  [ "${N:-0}" -gt 0 ] && echo "  $b (+$N)"
done
echo "── PR open:"
gh pr list --limit 5 2>/dev/null | head -5 || echo "  (không có)"
echo "── Demo stack:"
docker ps --format '{{.Names}}' 2>/dev/null | grep -c wakii-stack-demo | sed 's/^/  containers: /'
echo "════════════════════════════════════════════════"
