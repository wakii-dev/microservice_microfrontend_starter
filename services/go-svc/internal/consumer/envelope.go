// Package consumer — Kafka consumer cho topic `task-events` (story FI-76 SF-3).
// Thay REST ingest fire-and-forget (ADR-0006 → ADR-0008): consume envelope,
// ghi activity IDEMPOTENT bằng envelope id, retry ×3 → compensating
// `task.assignment_failed` → DLQ event gốc. Hợp đồng: contracts/events/task-events.md
// + platform/conventions/09-async-messaging.md. Thư viện: segmentio/kafka-go
// (ADR-0008 ghi franz-go = path production).
package consumer

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

// SchemaVersion hiện tại của envelope (task-events.md — cố định 1).
const SchemaVersion = 1

// Envelope — JSON envelope bắt buộc của mọi message trên task-events.
type Envelope struct {
	SchemaVersion int             `json:"schemaVersion"`
	ID            uuid.UUID       `json:"id"` // khóa idempotency — producer sinh MỖI event
	Type          string          `json:"type"`
	OccurredAt    time.Time       `json:"occurredAt"`
	Payload       json.RawMessage `json:"payload"`
}

// taskUserPayload — phần payload consumer cần để ghi activity: taskId + userId
// có ở cả 4 type consumer nhận (assignment_failed bị filter trước khi parse).
// Field lạ trong payload được BỎ QUA (conventions/09 rule 3 — non-breaking).
type taskUserPayload struct {
	TaskID     uuid.UUID `json:"taskId"`
	UserID     uuid.UUID `json:"userId"`
	AssigneeID uuid.UUID `json:"assigneeId"` // chỉ task.assigned — fail hook simulate
}

// assignmentFailedPayload — payload compensating event go-svc publish khi
// retry ×3 hết (task-events.md dòng `task.assignment_failed`).
type assignmentFailedPayload struct {
	TaskID     uuid.UUID `json:"taskId"`
	AssigneeID uuid.UUID `json:"assigneeId"`
	Reason     string    `json:"reason"`
}

// ParseEnvelope decode + validate envelope: schemaVersion == 1, id UUID hợp lệ,
// type thuộc enum 5 giá trị, occurredAt khác zero. Message sai shape = poison
// → caller ĐƯA thẳng DLQ (retry vô ích).
func ParseEnvelope(raw []byte) (Envelope, error) {
	var env Envelope
	if err := json.Unmarshal(raw, &env); err != nil {
		return Envelope{}, fmt.Errorf("decode envelope: %w", err)
	}
	if env.SchemaVersion != SchemaVersion {
		return Envelope{}, fmt.Errorf("schemaVersion = %d, want %d", env.SchemaVersion, SchemaVersion)
	}
	if env.ID == uuid.Nil {
		return Envelope{}, fmt.Errorf("envelope id rỗng — khóa idempotency bắt buộc")
	}
	switch env.Type {
	case model.ActionTaskCreated, model.ActionTaskUpdated, model.ActionTaskAssigned,
		model.ActionTaskDeleted, model.ActionTaskAssignmentFailed:
		// enum hợp lệ (task-events.md)
	default:
		return Envelope{}, fmt.Errorf("type %q ngoài enum task-events", env.Type)
	}
	if env.OccurredAt.IsZero() {
		return Envelope{}, fmt.Errorf("occurredAt rỗng")
	}
	return env, nil
}

// Marshal serialise envelope ra JSON (publish compensating).
func (e Envelope) Marshal() ([]byte, error) {
	return json.Marshal(e)
}
