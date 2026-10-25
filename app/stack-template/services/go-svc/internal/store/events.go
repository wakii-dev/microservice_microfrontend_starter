package store

import (
	"context"
	"fmt"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

// ErrTasksUnavailable deprecated — sentinel chuyển sang internal/apperr
// (dùng chung api ↔ store không import cycle). Giữ alias cho tiện đọc.
// (Không export thêm lỗi mới từ package store.)

// InsertEvent persist event (owner conn — go_svc owns schema activity).
// Idempotency (conventions/09 rule 4): e.ID là envelope id do producer sinh
// (node-svc outbox, mỗi event 1 id) — at-least-once redelivery cùng event →
// ON CONFLICT DO NOTHING, KHÔNG nhân đôi feed. KHÔNG sinh id ở đây (api UUID
// ingest đã thanh lý — id luôn đến từ envelope).
func (s *Store) InsertEvent(ctx context.Context, e *model.Event) error {
	tag, err := s.owner.ExecContext(ctx, `
		INSERT INTO activity.events (id, task_id, user_id, action, event_ts, user_name, task_title)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO NOTHING`,
		e.ID, e.TaskID, e.UserID, e.Action, e.Timestamp, e.UserName, e.TaskTitle)
	if err != nil {
		return fmt.Errorf("insert event: %w", err)
	}
	if n, raErr := tag.RowsAffected(); raErr == nil && n == 0 {
		s.log.Info("event duplicate skipped (idempotency)", "eventId", e.ID.String())
	}
	return nil
}

// ListEvents trả feed (mới nhất trước) + total (conventions: limit đã clamp ở handler).
func (s *Store) ListEvents(ctx context.Context, limit, offset int) ([]model.Event, int, error) {
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

	var out []model.Event
	for rows.Next() {
		var e model.Event
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
