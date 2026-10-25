// Package model — kiểu dữ liệu dùng chung store ↔ api (không import cycle).
package model

import (
	"time"

	"github.com/google/uuid"
)

// Event — dòng activity event (mirror activity.events; display fields
// resolve best-effort lúc consume — nguồn: Kafka envelope, không còn REST ingest).
type Event struct {
	ID        uuid.UUID // envelope id do producer sinh — KHÓA IDEMPOTENCY
	TaskID    uuid.UUID
	UserID    uuid.UUID
	Action    string
	Timestamp time.Time
	UserName  string
	TaskTitle string
}

// Action constants — khớp enum ActivityFeedItem.action (activity.yaml) =
// envelope type enum (contracts/events/task-events.md). 5 giá trị CHECK
// constraint migration 0002.
const (
	ActionTaskCreated         = "task.created"
	ActionTaskUpdated         = "task.updated"
	ActionTaskDeleted         = "task.deleted"
	ActionTaskAssigned        = "task.assigned"
	ActionTaskAssignmentFailed = "task.assignment_failed"
)

// TaskStats — stats từ schema tasks (readonly, canonical DDL).
type TaskStats struct {
	TotalTasks int
	ByStatus   map[string]int // todo / in_progress / done / assignment_failed — 4 giá trị CHECK (SF-2 cascade)
}
