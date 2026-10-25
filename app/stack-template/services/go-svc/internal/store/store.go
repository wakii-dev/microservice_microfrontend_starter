// Package store — DB layer của go-svc:
//   - owner connection (DATABASE_URL, role go_svc): schema activity — INSERT/SELECT events
//   - readonly connection (DATABASE_READONLY_URL, role go_readonly): schema tasks — stats
// Permission boundary: go_readonly CHỈ có SELECT trên schema tasks
// (platform/postgres/init/01-init.sh — ALTER DEFAULT PRIVILEGES FOR ROLE node_svc).
package store

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // database/sql driver "pgx"
)

// Store giữ 2 connection pool riêng biệt — mixing chúng sẽ phá permission demo.
type Store struct {
	owner    *sql.DB
	readonly *sql.DB
	log      *slog.Logger
	migrated bool
}

// Open mở 2 pool + ping cả hai (fail-fast khi DB không reachable lúc boot).
func Open(ctx context.Context, ownerURL, readonlyURL string, log *slog.Logger) (*Store, error) {
	owner, err := sql.Open("pgx", ownerURL)
	if err != nil {
		return nil, fmt.Errorf("open owner conn: %w", err)
	}
	if err := owner.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping owner conn: %w", err)
	}
	ro, err := sql.Open("pgx", readonlyURL)
	if err != nil {
		return nil, fmt.Errorf("open readonly conn: %w", err)
	}
	if err := ro.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping readonly conn: %w", err)
	}
	return &Store{owner: owner, readonly: ro, log: log}, nil
}

// Close đóng cả 2 pool.
func (s *Store) Close() error {
	err1 := s.owner.Close()
	err2 := s.readonly.Close()
	if err1 != nil {
		return err1
	}
	return err2
}

// Ready implements api.ReadinessChecker (conventions/02 go-svc row):
// migration schema activity xong + SELECT thử được schema tasks (readonly role).
// Probe có timeout 3s — DB hang không được treo readyz (P1 code-review).
func (s *Store) Ready() error {
	if !s.migrated {
		return fmt.Errorf("migration schema activity not applied")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	return s.Probe(ctx)
}
