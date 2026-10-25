package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/apperr"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

// Side của readonly connection (go_readonly): CHỈ SELECT schema tasks.
// Query khớp chính xác canonical DDL — contracts/db/tasks-schema.sql:
//   status varchar(20) CHECK IN ('todo','in_progress','done').

// isPermissionOrMissing — phân biệt lỗi permission/schema với lỗi thật khác.
func isPermissionOrMissing(err error) bool {
	if err == nil {
		return false
	}
	var pgErr interface{ SQLState() string }
	if errors.As(err, &pgErr) {
		switch pgErr.SQLState() {
		case "42501": // insufficient_privilege — readonly grant bị revoke
			return true
		case "42P01": // undefined_table — SF-2 chưa migrate
			return true
		case "3D000": // invalid_catalog_name — schema chưa tồn tại
			return true
		}
	}
	return false
}

// mapTasksError — lỗi đọc tasks → apperr.ErrTasksUnavailable (503) hoặc passthrough.
func mapTasksError(err error) error {
	if err == nil {
		return nil
	}
	if isPermissionOrMissing(err) {
		return apperr.ErrTasksUnavailable
	}
	return err
}

// TaskTitle lookup 1 task (readonly) — "" khi không tìm thấy/không đọc được
// (best-effort display field, không raise).
func (s *Store) TaskTitle(ctx context.Context, id uuid.UUID) (string, error) {
	var title string
	err := s.readonly.QueryRowContext(ctx,
		`SELECT title FROM tasks.tasks WHERE id = $1`, id).Scan(&title)
	if errors.Is(err, sql.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", mapTasksError(err)
	}
	return title, nil
}

// Stats — COUNT(*) + GROUP BY status trên tasks.tasks (readonly, canonical DDL).
// tasks chưa tồn tại / mất grant → ErrTasksUnavailable → handler 503.
func (s *Store) Stats(ctx context.Context) (model.TaskStats, error) {
	var total int
	if err := s.readonly.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM tasks.tasks`).Scan(&total); err != nil {
		return model.TaskStats{}, mapTasksError(fmt.Errorf("count tasks: %w", err))
	}

	rows, err := s.readonly.QueryContext(ctx,
		`SELECT status, COUNT(*) FROM tasks.tasks GROUP BY status`)
	if err != nil {
		return model.TaskStats{}, mapTasksError(fmt.Errorf("group tasks by status: %w", err))
	}
	defer rows.Close()

	byStatus := map[string]int{"todo": 0, "in_progress": 0, "done": 0, "assignment_failed": 0}
	for rows.Next() {
		var st string
		var n int
		if err := rows.Scan(&st, &n); err != nil {
			return model.TaskStats{}, fmt.Errorf("scan status row: %w", err)
		}
		byStatus[st] = n
	}
	if err := rows.Err(); err != nil {
		return model.TaskStats{}, fmt.Errorf("iterate status rows: %w", err)
	}
	return model.TaskStats{TotalTasks: total, ByStatus: byStatus}, nil
}

// Probe — SELECT thử schema tasks bằng readonly role (readyz, conventions/02).
// Bảng tồn tại nhưng RỖNG (node-svc migrate xong, chưa ai tạo task) → OK
// (P1 code-review: sql.ErrNoRows ≠ permission/schema problem).
func (s *Store) Probe(ctx context.Context) error {
	var one int
	err := s.readonly.QueryRowContext(ctx,
		`SELECT 1 FROM tasks.tasks LIMIT 1`).Scan(&one)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return mapTasksError(fmt.Errorf("probe schema tasks (readonly): %w", err))
	}
	return nil
}
