package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Event mirror dòng activity.events — display fields đã resolve best-effort.
type Event struct {
	ID        uuid.UUID
	TaskID    uuid.UUID
	UserID    uuid.UUID
	Action    string
	Timestamp time.Time
	UserName  string
	TaskTitle string
}

// ErrTasksUnavailable — schema tasks chưa migrate / không đọc được (readonly).
// Handlers map sang 503 DEPENDENCY_DOWN (conventions/04).
var ErrTasksUnavailable = errors.New("schema tasks unavailable (not migrated yet or readonly permission denied)")

// InsertEvent persist event (owner conn — go_svc owns schema activity).
func (s *Store) InsertEvent(ctx context.Context, e *Event) error {
	_, err := s.owner.ExecContext(ctx, `
		INSERT INTO activity.events (id, task_id, user_id, action, event_ts, user_name, task_title)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		e.ID, e.TaskID, e.UserID, e.Action, e.Timestamp, e.UserName, e.TaskTitle)
	if err != nil {
		return fmt.Errorf("insert event: %w", err)
	}
	return nil
}

// ListEvents trả feed (mới nhất trước) + total (conventions: limit đã clamp ở handler).
func (s *Store) ListEvents(ctx context.Context, limit, offset int) ([]Event, int, error) {
	var total int
	if err := s.owner.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM activity.events`).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count events: %w", err)
	}
	rows, err := s.owner.QueryContext(ctx, `
		SELECT id, task_id, user_id, action, event_ts, user_name, task_title
		FROM activity.events
		ORDER BY event_ts DESC, id DESC
		LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list events: %w", err)
	}
	defer rows.Close()

	var out []Event
	for rows.Next() {
		var e Event
		if err := rows.Scan(&e.ID, &e.TaskID, &e.UserID, &e.Action, &e.Timestamp, &e.UserName, &e.TaskTitle); err != nil {
			return nil, 0, fmt.Errorf("scan event: %w", err)
		}
		out = append(out, e)
	}
	return out, total, rows.Err()
}

// CountRecent24h — số event trong 24h qua (owner conn — schema activity của mình).
func (s *Store) CountRecent24h(ctx context.Context) (int, error) {
	var n int
	err := s.owner.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM activity.events WHERE event_ts > now() - interval '24 hours'`).Scan(&n)
	if err != nil {
		return 0, fmt.Errorf("count recent events: %w", err)
	}
	return n, nil
}
