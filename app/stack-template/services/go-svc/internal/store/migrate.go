package store

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"sort"
	"strconv"
	"strings"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Migrate chạy embedded migrations lên schema activity (go_svc là owner).
// Idempotent: bảng activity.schema_migrations track version đã apply.
func (s *Store) Migrate(ctx context.Context) error {
	if _, err := s.owner.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS activity.schema_migrations (
			version     integer PRIMARY KEY,
			description text        NOT NULL,
			applied_at  timestamptz NOT NULL DEFAULT now()
		)`); err != nil {
		return fmt.Errorf("ensure schema_migrations: %w", err)
	}

	var current int
	if err := s.owner.QueryRowContext(ctx,
		`SELECT COALESCE(MAX(version), 0) FROM activity.schema_migrations`).Scan(&current); err != nil {
		return fmt.Errorf("read current migration version: %w", err)
	}

	entries, err := fs.Glob(migrationsFS, "migrations/*.sql")
	if err != nil {
		return fmt.Errorf("list migrations: %w", err)
	}
	sort.Strings(entries)

	for _, name := range entries {
		version, desc, err := parseMigrationName(name)
		if err != nil {
			return err
		}
		if version <= current {
			continue
		}
		sqlBytes, err := migrationsFS.ReadFile(name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		tx, err := s.owner.BeginTx(ctx, nil)
		if err != nil {
			return fmt.Errorf("begin migration %s: %w", name, err)
		}
		if _, err := tx.ExecContext(ctx, string(sqlBytes)); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("apply migration %s: %w", name, err)
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO activity.schema_migrations (version, description) VALUES ($1, $2)`,
			version, desc); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("record migration %s: %w", name, err)
		}
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit migration %s: %w", name, err)
		}
		s.log.Info("migration applied", "version", version, "description", desc)
	}
	s.migrated = true
	return nil
}

// parseMigrationName parse "0001_create_events.sql" → (1, "create_events").
func parseMigrationName(name string) (int, string, error) {
	base := strings.TrimSuffix(strings.TrimPrefix(name, "migrations/"), ".sql")
	parts := strings.SplitN(base, "_", 2)
	if len(parts) != 2 {
		return 0, "", fmt.Errorf("migration name %q sai format NNNN_desc.sql", name)
	}
	version, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, "", fmt.Errorf("migration prefix %q không phải số: %w", parts[0], err)
	}
	if parts[1] == "" {
		return 0, "", fmt.Errorf("migration %q thiếu description", name)
	}
	return version, parts[1], nil
}
