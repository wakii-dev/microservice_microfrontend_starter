package api

// Interfaces handlers tiêu thụ — store/resolve implement ngầm (không import cycle).
import (
	"context"

	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

// EventStore — persist + list events (schema activity, owner conn).
type EventStore interface {
	InsertEvent(ctx context.Context, e *model.Event) error
	ListEvents(ctx context.Context, limit, offset int) ([]model.Event, int, error)
	CountRecent24h(ctx context.Context) (int, error)
}

// TaskReader — đọc schema tasks (readonly conn).
type TaskReader interface {
	TaskTitle(ctx context.Context, id uuid.UUID) (string, error)
	Stats(ctx context.Context) (model.TaskStats, error)
	Probe(ctx context.Context) error
}

// DisplayResolver — resolve userName qua spring REST (best-effort).
type DisplayResolver interface {
	UserName(ctx context.Context, authorization string, userID uuid.UUID) string
}

// Lỗi schema tasks không đọc được: store trả apperr.ErrTasksUnavailable —
// handlers map → 503 DEPENDENCY_DOWN (conventions/04).
