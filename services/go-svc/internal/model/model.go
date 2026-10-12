// Package model — kiểu dữ liệu dùng chung store ↔ api (không import cycle).
package model

import (
	"time"

	"github.com/google/uuid"
)

// Event — dòng activity event (mirror activity.events; display fields
// resolve best-effort lúc ingest).
type Event struct {
	ID        uuid.UUID
	TaskID    uuid.UUID
	UserID    uuid.UUID
	Action    string
	Timestamp time.Time
	UserName  string
	TaskTitle string
}

// TaskStats — stats từ schema tasks (readonly, canonical DDL).
type TaskStats struct {
	TotalTasks int
	ByStatus   map[string]int // todo / in_progress / done — 3 giá trị CHECK constraint
}
