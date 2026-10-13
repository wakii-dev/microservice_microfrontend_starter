package consumer

// handler.go — xử lý 1 envelope thành activity row (đồng mức app; idempotency
// nằm ở DB: InsertEvent ON CONFLICT DO NOTHING bằng envelope id).

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/resolve"
)

// FailUserID — fixture user svc-fail (fail@demo.local, users.json SF-1).
// Consume task.assigned có assigneeId = user này → Handler CỐ TÌNH fail
// (deterministic cho e2e saga SF-5: retry ×3 → compensating → DLQ).
var FailUserID = uuid.MustParse("55555555-5555-4555-8555-555555555555")

// Store — phần schema activity consumer cần (Store thật implement ngầm).
type Store interface {
	InsertEvent(ctx context.Context, e *model.Event) error
}

// Tasks — phần readonly schema tasks consumer cần (TaskTitle display field).
type Tasks interface {
	TaskTitle(ctx context.Context, id uuid.UUID) (string, error)
}

// Handler consume 1 envelope: filter-by-type → fail hook → resolve display
// fields best-effort → INSERT activity. KHÔNG commit offset ở đây (runner lo).
type Handler struct {
	Store    Store
	Tasks    Tasks
	Resolver *resolve.Resolver // ServiceUserName — enrich bằng service-token
	Log      *slog.Logger
}

// Handle xử lý 1 envelope. Return nil = OK (kể cả duplicate idempotency —
// DB DO NOTHING); return error = caller retry → DLQ.
func (h *Handler) Handle(ctx context.Context, env Envelope) error {
	// Filter-by-type (task-events.md consumer groups): group go-svc-activity
	// nhận MỌI type TRỪ task.assignment_failed (compensating là của node).
	if env.Type == model.ActionTaskAssignmentFailed {
		h.Log.Info("skip assignment_failed (filter-by-type)", "eventId", env.ID.String())
		return nil
	}

	var p taskUserPayload
	if err := json.Unmarshal(env.Payload, &p); err != nil {
		return fmt.Errorf("decode payload %s: %w", env.Type, err)
	}
	if p.TaskID == uuid.Nil {
		return fmt.Errorf("payload %s thiếu taskId", env.Type)
	}
	if p.UserID == uuid.Nil {
		return fmt.Errorf("payload %s thiếu userId", env.Type)
	}

	// Simulate fail hook — deterministic cho saga e2e (spec slice mục 9).
	if env.Type == model.ActionTaskAssigned && p.AssigneeID == FailUserID {
		return fmt.Errorf("simulate notify fail (assigneeId=%s — fixture svc-fail)", p.AssigneeID)
	}

	ev := &model.Event{
		ID:        env.ID, // envelope id — KHÔNG sinh mới (khóa idempotency)
		TaskID:    p.TaskID,
		UserID:    p.UserID,
		Action:    env.Type,
		Timestamp: env.OccurredAt.UTC(),
	}
	// Display fields best-effort lúc consume — spring/tasks down → "" (feed
	// vẫn render, resolver trả thử lại lúc đọc — feed.go).
	ev.UserName = h.Resolver.ServiceUserName(ctx, p.UserID)
	if title, err := h.Tasks.TaskTitle(ctx, p.TaskID); err == nil {
		ev.TaskTitle = title
	}

	if err := h.Store.InsertEvent(ctx, ev); err != nil {
		return fmt.Errorf("insert activity: %w", err)
	}
	h.Log.Info("event consumed",
		slog.String("eventId", env.ID.String()),
		slog.String("taskId", p.TaskID.String()),
		slog.String("action", env.Type),
	)
	return nil
}
