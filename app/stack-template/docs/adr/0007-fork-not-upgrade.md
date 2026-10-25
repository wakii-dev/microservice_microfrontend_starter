# ADR 0007 — Fork-not-upgrade (copy boilerplate, không dependence)

Ngày: 2026-10-12 · Status: Accepted

## Context
Boilerplate nội bộ có thể phân phối như template repo (clone + rename), shared library/parent-pom (upgrade tập trung), hay generator (sinh code có lịch sử).

## Decision
**Fork-not-upgrade**: `scripts/scaffold/scaffold.sh` COPY toàn bộ (prune phần boilerplate-infra: spike, story docs, workflow templates) + rename scope → project mới sở hữu code 100%, KHÔNG có dependency ngược về boilerplate gốc. Không generator framework, không shared-versioning.

## Consequences
- (+) Project copy tự do tiến hoá; không vỡ khi boilerplate gốc đổi; đọc code là hiểu hết (không magic từ generator).
- (−) Bug fix ở boilerplate gốc KHÔNG tự lan sang project đã copy — muốn nhận fix = fork lại hoặc cherry-pick thủ công. Chấp nhận: template nội bộ thay đổi chậm, mỗi project đủ trưởng để tự sở hữu code.
- (−) Lockfile: lần install đầu phải `--no-frozen-lockfile` (importers của thư mục đã prune còn sót) — ghi trong SCAFFOLD.md.
