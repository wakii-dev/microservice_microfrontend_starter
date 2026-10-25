-- 0002 — cụm nguyên tử activity-side cascade (story FI-76 SF-3 / Linear FI-80).
-- Consumer Kafka ghi thêm 2 action mới qua envelope type:
--   task.assigned (13 ký tự) + task.assignment_failed (22 ký tự > varchar(20) cũ).
-- P0 ×2 (context pack sf-3): width + CHECK phải CÙNG migration — chỉ sửa CHECK
-- quên width = InsertEvent chết runtime cho assignment_failed → retry ×3 → DLQ
-- sai nguyên nhân.

ALTER TABLE activity.events ALTER COLUMN action TYPE varchar(40);

ALTER TABLE activity.events DROP CONSTRAINT events_action_check;

ALTER TABLE activity.events ADD CONSTRAINT events_action_check
    CHECK (action IN ('task.created', 'task.updated', 'task.deleted',
                      'task.assigned', 'task.assignment_failed'));
