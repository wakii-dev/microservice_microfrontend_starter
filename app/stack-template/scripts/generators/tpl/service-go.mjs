// service-go.mjs — Go chi service template (gen-service --lang go).
// Per the conventions: 01 Dockerfile (distroless nonroot — NO compose healthcheck,
// gateway depends service_started — conventions/02 rule 3), 02 health naked+mirror
// with a REAL readyz probe, 03 slog JSON, 04 error envelope, 05 PORT env,
// 06 env fail-fast, 07 CORS dev-profile, 08 /api/<name> prefix + JWT verify.
// REAL CRUD for the default resource `items` (table <service>_items): list with
// ?limit/&offset pagination (tasks pattern) + get + create + patch + delete —
// the same surface as the TS template. Store seam: MemoryStore always (unit
// tests + no-db mode), PgStore (pgx + embedded idempotent migration at boot)
// when --db is chosen. Layout mirrors services/go-svc (cmd/server + internal/).
// ctx: { name, pascal, camel, scream, snake, dbRole, port, db, goModule }.

/** Backtick helper — Go struct tags need literal backticks inside the literals below. */
const tag = (s) => '`' + s + '`';

/** Schema-qualified table identifier for the default resource (mirrors the TS template). */
function itemsTable(ctx) {
  return ctx.db === 'dedicated' ? `${ctx.snake}_items` : `${ctx.snake}.${ctx.snake}_items`;
}

function dockerfile(ctx) {
  return (
    `# ` +
    ctx.name +
    ` — built per platform/conventions/01-dockerfile-pattern.md (Go).
# Distroless runtime: NO shell/wget → compose declares NO healthcheck
# (conventions/02 rule 3 — readiness is proven by boot-smoke/e2e polling).
# go.sum must exist before build: run "go mod tidy" once after generation.

FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/` +
    ctx.name +
    ` ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot AS runtime
COPY --from=build /out/` +
    ctx.name +
    ` /` +
    ctx.name +
    `
EXPOSE ` +
    ctx.port +
    `
ENTRYPOINT ["/` +
    ctx.name +
    `"]
`
  );
}

function goMod(ctx) {
  return (
    `module ` +
    ctx.goModule +
    `/services/` +
    ctx.name +
    `

go 1.24

require (
\tgithub.com/go-chi/chi/v5 v5.3.2
\tgithub.com/golang-jwt/jwt/v5 v5.3.1
\tgithub.com/rs/cors v1.11.1
` +
    (ctx.db ? `\tgithub.com/jackc/pgx/v5 v5.7.5\n` : '') +
    `)
`
  );
}

function storeGo(ctx) {
  return (
    `// Package store — the repository seam for the default \`items\` resource
// (pattern of services/go-svc/internal/store). The route layer depends ONLY on
// the Store interface → unit tests inject the MemoryStore (or a fake); the pg
// implementation (pg.go, generated with --db) is wired in cmd/server/main.go.
// Swap \`name\` for the real domain fields (contract-first: update
// contracts/openapi/` +
    ctx.name +
    `.yaml FIRST, then this file).
package store

import (
	"context"
	"crypto/rand"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

// Item — JSON shape matches the Item schema of the generated contract
// (camelCase fields, RFC3339 timestamps).
type Item struct {
	ID        string    ` + tag('json:"id"') + `
	Name      string    ` + tag('json:"name"') + `
	CreatedAt time.Time ` + tag('json:"createdAt"') + `
	UpdatedAt time.Time ` + tag('json:"updatedAt"') + `
}

// Page — paginated list envelope (tasks pattern: ?limit/&offset, newest first).
type Page struct {
	Items []Item ` + tag('json:"items"') + `
	Total int    ` + tag('json:"total"') + `
}

// Store — repository contract. Store errors surface as 500 INTERNAL; a missing
// row is modelled as (nil, nil) / false so handlers map it to 404 NOT_FOUND.
type Store interface {
	List(ctx context.Context, limit, offset int) (Page, error)
	Get(ctx context.Context, id string) (*Item, error)
	Create(ctx context.Context, name string) (Item, error)
	Update(ctx context.Context, id, name string) (*Item, error)
	Delete(ctx context.Context, id string) (bool, error)
	// Ping — readiness probe backing /readyz (conventions/02 rule 2). Probe the
	// REAL dependency here; never hardcode ok.
	Ping(ctx context.Context) error
}

// ValidUUID — the contract types ids as uuid; handlers validate the path param
// with this before it reaches the store (400 VALIDATION_ERROR otherwise).
func ValidUUID(id string) bool {
	if len(id) != 36 || id[8] != '-' || id[13] != '-' || id[18] != '-' || id[23] != '-' {
		return false
	}
	for i := 0; i < 36; i++ {
		switch i {
		case 8, 13, 18, 23:
			continue
		}
		c := id[i]
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}

// NewUUID — RFC 4122 v4 from crypto/rand (memory store ids; pg generates ids
// server-side via gen_random_uuid()).
func NewUUID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

// MemoryStore — in-memory Store used while the service has no database and by
// unit tests (same shape as the TS template's repo.memory). Newest-first
// ordering by creation sequence; patches never reorder the list.
type MemoryStore struct {
	mu    sync.Mutex
	items map[string]Item
	seq   map[string]int64
	order int64
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{items: map[string]Item{}, seq: map[string]int64{}}
}

func (m *MemoryStore) List(_ context.Context, limit, offset int) (Page, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	all := make([]Item, 0, len(m.items))
	for _, it := range m.items {
		all = append(all, it)
	}
	sort.Slice(all, func(i, j int) bool {
		if m.seq[all[i].ID] != m.seq[all[j].ID] {
			return m.seq[all[i].ID] > m.seq[all[j].ID]
		}
		return all[i].ID < all[j].ID
	})
	if offset > len(all) {
		offset = len(all)
	}
	end := offset + limit
	if end > len(all) {
		end = len(all)
	}
	return Page{Items: all[offset:end], Total: len(all)}, nil
}

func (m *MemoryStore) Get(_ context.Context, id string) (*Item, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	it, ok := m.items[strings.ToLower(id)]
	if !ok {
		return nil, nil
	}
	out := it
	return &out, nil
}

func (m *MemoryStore) Create(_ context.Context, name string) (Item, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	now := time.Now().UTC()
	it := Item{ID: NewUUID(), Name: name, CreatedAt: now, UpdatedAt: now}
	m.order++
	m.items[it.ID] = it
	m.seq[it.ID] = m.order
	return it, nil
}

func (m *MemoryStore) Update(_ context.Context, id, name string) (*Item, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	key := strings.ToLower(id)
	it, ok := m.items[key]
	if !ok {
		return nil, nil
	}
	it.Name = name
	it.UpdatedAt = time.Now().UTC()
	m.items[key] = it
	out := it
	return &out, nil
}

func (m *MemoryStore) Delete(_ context.Context, id string) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	key := strings.ToLower(id)
	if _, ok := m.items[key]; !ok {
		return false, nil
	}
	delete(m.items, key)
	delete(m.seq, key)
	return true, nil
}

// Ping — no real dependency yet (rule 2): probe the dependency HERE once it lands.
func (m *MemoryStore) Ping(_ context.Context) error { return nil }
`
  );
}

function pgGo(ctx) {
  return (
    `// pg.go — pgx implementation of Store for the default \`items\` resource.
// The table identifier is generated (` +
    itemsTable(ctx) +
    `) and asserted to a safe
// charset — identifiers are interpolated (SQL identifiers cannot be bound as
// parameters), values always are. Generated by gen-service (--lang go --db).
package store

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"regexp"
	"sort"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// itemsTable — the default resource table; keep in sync with
// internal/store/migrations + platform/postgres/init/02-` +
    ctx.name +
    `.sh.
const itemsTable = "` +
    itemsTable(ctx) +
    `"

type PgStore struct {
	pool  *pgxpool.Pool
	table string
}

func NewPgStore(ctx context.Context, dbURL string) (*PgStore, error) {
	// identifier guard — the table name comes from generation, assert anyway
	if !regexp.MustCompile(` + tag('^[a-z0-9_]+(\\.[a-z0-9_]+)?$') + `).MatchString(itemsTable) {
		return nil, fmt.Errorf("invalid table identifier: %s", itemsTable)
	}
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		return nil, err
	}
	return &PgStore{pool: pool, table: itemsTable}, nil
}

// Migrate — runs the embedded SQL at boot (idempotent CREATE TABLE IF NOT
// EXISTS). Single-file scaffold of the go-svc runner (internal/store/migrate.go
// tracks versions in schema_migrations) — switch to that pattern when the
// domain grows beyond one migration.
func (s *PgStore) Migrate(ctx context.Context) error {
	entries, err := fs.Glob(migrationsFS, "migrations/*.sql")
	if err != nil {
		return fmt.Errorf("list migrations: %w", err)
	}
	sort.Strings(entries)
	for _, name := range entries {
		sqlBytes, err := migrationsFS.ReadFile(name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		if _, err := s.pool.Exec(ctx, string(sqlBytes)); err != nil {
			return fmt.Errorf("apply migration %s: %w", name, err)
		}
	}
	return nil
}

func (s *PgStore) List(ctx context.Context, limit, offset int) (Page, error) {
	rows, err := s.pool.Query(ctx,
		"SELECT id, name, created_at, updated_at FROM "+s.table+" ORDER BY created_at DESC LIMIT $1 OFFSET $2",
		limit, offset)
	if err != nil {
		return Page{}, err
	}
	defer rows.Close()
	items := make([]Item, 0)
	for rows.Next() {
		var it Item
		if err := rows.Scan(&it.ID, &it.Name, &it.CreatedAt, &it.UpdatedAt); err != nil {
			return Page{}, err
		}
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		return Page{}, err
	}
	var total int
	if err := s.pool.QueryRow(ctx, "SELECT count(*) FROM "+s.table).Scan(&total); err != nil {
		return Page{}, err
	}
	return Page{Items: items, Total: total}, nil
}

func (s *PgStore) Get(ctx context.Context, id string) (*Item, error) {
	var it Item
	err := s.pool.QueryRow(ctx,
		"SELECT id, name, created_at, updated_at FROM "+s.table+" WHERE id = $1", id).
		Scan(&it.ID, &it.Name, &it.CreatedAt, &it.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &it, nil
}

func (s *PgStore) Create(ctx context.Context, name string) (Item, error) {
	var it Item
	err := s.pool.QueryRow(ctx,
		"INSERT INTO "+s.table+" (name) VALUES ($1) RETURNING id, name, created_at, updated_at", name).
		Scan(&it.ID, &it.Name, &it.CreatedAt, &it.UpdatedAt)
	return it, err
}

func (s *PgStore) Update(ctx context.Context, id, name string) (*Item, error) {
	var it Item
	err := s.pool.QueryRow(ctx,
		"UPDATE "+s.table+" SET name = $2, updated_at = now() WHERE id = $1 RETURNING id, name, created_at, updated_at",
		id, name).
		Scan(&it.ID, &it.Name, &it.CreatedAt, &it.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &it, nil
}

func (s *PgStore) Delete(ctx context.Context, id string) (bool, error) {
	tag, err := s.pool.Exec(ctx, "DELETE FROM "+s.table+" WHERE id = $1", id)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

// Ping — REAL readiness probe: SELECT 1 against the pool (conventions/02 rule 2).
func (s *PgStore) Ping(ctx context.Context) error {
	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return s.pool.Ping(pingCtx)
}

// Close — called from the shutdown path in cmd/server/main.go.
func (s *PgStore) Close() { s.pool.Close() }
`
  );
}

function migrationSql(ctx) {
  return `-- 0001 — default resource table for ` +
    ctx.name +
    ` (schema-per-service or dedicated DB).
-- Idempotent: safe to run at every boot (PgStore.Migrate). The table identifier
-- must match internal/store/pg.go (itemsTable) + platform/postgres/init/02-` +
    ctx.name +
    `.sh.
-- Rename for the real domain — see services/` +
    ctx.name +
    `/README.md.
CREATE TABLE IF NOT EXISTS ` +
    itemsTable(ctx) +
    ` (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text        NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
`;
}

function apiGo(ctx) {
  return (
    `// Package api — the HTTP surface per the conventions: 02 health naked+mirror
// with a REAL readyz probe, 03 one-line slog request log, 04 shared error
// envelope, 08 /api/` +
    ctx.name +
    ` prefix + service-side JWT verify. Generated by gen-service.
package api

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	jwtlib "github.com/golang-jwt/jwt/v5"

	"` +
    ctx.goModule +
    `/services/` +
    ctx.name +
    `/internal/store"
)

const serviceName = "` +
    ctx.name +
    `"

// ---- shared error envelope (conventions/04) ----

type apiError struct {
	Code      string ` + tag('json:"code"') + `
	Message   string ` + tag('json:"message"') + `
	RequestID string ` + tag('json:"requestId"') + `
	Details   any    ` + tag('json:"details"') + `
}

type errorEnvelope struct {
	Error apiError ` + tag('json:"error"') + `
}

func requestID(r *http.Request) string { return r.Header.Get("X-Request-Id") }

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, reqID, code, msg string) {
	writeJSON(w, status, errorEnvelope{Error: apiError{Code: code, Message: msg, RequestID: reqID, Details: nil}})
}

func writeOK(w http.ResponseWriter) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"}) // fixed shape — conventions/02
}

// ---- health (conventions/02): naked + /api/<name> mirror, auth-free ----

func healthz(w http.ResponseWriter, _ *http.Request) { writeOK(w) }

func readyz(st store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		// probe for REAL (rule 2) — static message keeps pg details out of the response
		if err := st.Ping(ctx); err != nil {
			writeErr(w, http.StatusServiceUnavailable, requestID(r), "DEPENDENCY_DOWN", "service is not ready (dependency probe failed)")
			return
		}
		writeOK(w)
	}
}

// ---- JWT guard (conventions/08 rule 4 — the service verifies itself) ----

func jwtGuard(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := r.Header.Get("Authorization")
			token := strings.TrimPrefix(h, "Bearer ")
			if token == "" || token == h {
				writeErr(w, http.StatusUnauthorized, requestID(r), "UNAUTHORIZED", "Missing Authorization header")
				return
			}
			if _, err := jwtlib.Parse(token, func(t *jwtlib.Token) (any, error) {
				return []byte(secret), nil
			}, jwtlib.WithValidMethods([]string{"HS256"})); err != nil {
				writeErr(w, http.StatusUnauthorized, requestID(r), "UNAUTHORIZED", "Invalid or expired token")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ---- one-line request log (conventions/03) ----

func requestLog(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			next.ServeHTTP(w, r)
			log.Info("request", "method", r.Method, "path", r.URL.Path, "duration_ms", time.Since(start).Milliseconds(), "requestId", r.Header.Get("X-Request-Id"))
		})
	}
}

// New — assembles the router: health naked + mirror, CRUD under /api/<name>,
// envelope-mapped 404/405. The caller wraps the result with the CORS
// dev-profile handler (conventions/07) — see cmd/server/main.go.
func New(log *slog.Logger, st store.Store, jwtSecret string) http.Handler {
	r := chi.NewRouter()
	r.Use(requestLog(log))

	// naked health (compose/boot-smoke — the gateway does NOT route this path)
	r.Get("/healthz", healthz)
	r.Get("/readyz", readyz(st))

	// every non-route error keeps the shared envelope (conventions/04)
	r.NotFound(func(w http.ResponseWriter, req *http.Request) {
		writeErr(w, http.StatusNotFound, requestID(req), "NOT_FOUND", "Route "+req.Method+" "+req.URL.Path+" does not exist")
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, req *http.Request) {
		writeErr(w, http.StatusMethodNotAllowed, requestID(req), "METHOD_NOT_ALLOWED", "Method "+req.Method+" is not allowed here")
	})

	// business routes under /api/<name> (conventions/08 — pass-through)
	r.Route("/api/"+serviceName, func(rr chi.Router) {
		rr.Get("/healthz", healthz) // mirror — conventions/02 rule 6
		rr.Get("/readyz", readyz(st))
		rr.Group(func(rg chi.Router) {
			rg.Use(jwtGuard(jwtSecret))
			rg.Get("/items", listItems(log, st))
			rg.Post("/items", createItem(log, st))
			rg.Get("/items/{itemId}", getItem(log, st))
			rg.Patch("/items/{itemId}", patchItem(log, st))
			rg.Delete("/items/{itemId}", deleteItem(log, st))
		})
	})

	return r
}
`
  );
}

function itemsGo(ctx) {
  return (
    `// items.go — default resource routes (REAL CRUD, tasks pattern): paginated
// list, get, create, patch, delete. Swap the resource for your real domain:
// update contracts/openapi/` +
    ctx.name +
    `.yaml FIRST (contract-first), then edit this
// file + internal/store. Generated by gen-service (--lang go).
package api

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"` +
    ctx.goModule +
    `/services/` +
    ctx.name +
    `/internal/store"
)

func decodeBody(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		writeErr(w, http.StatusBadRequest, requestID(r), "VALIDATION_ERROR", "invalid JSON body")
		return false
	}
	return true
}

// validateName — mirrors the contract (minLength 1, maxLength 200) + the SQL
// CHECK (btrim non-empty): whitespace-only names are rejected.
func validateName(w http.ResponseWriter, r *http.Request, name string) bool {
	if strings.TrimSpace(name) == "" {
		writeErr(w, http.StatusBadRequest, requestID(r), "VALIDATION_ERROR", "name is required")
		return false
	}
	if len(name) > 200 {
		writeErr(w, http.StatusBadRequest, requestID(r), "VALIDATION_ERROR", "name must be at most 200 characters")
		return false
	}
	return true
}

func parseUUIDParam(w http.ResponseWriter, r *http.Request) (string, bool) {
	id := chi.URLParam(r, "itemId")
	if !store.ValidUUID(id) {
		writeErr(w, http.StatusBadRequest, requestID(r), "VALIDATION_ERROR", "itemId must be a valid UUID")
		return "", false
	}
	return id, true
}

// listItems — GET /items?limit&offset — default 20/0; limit 1..100, offset ≥ 0.
func listItems(log *slog.Logger, st store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		limit, offset := 20, 0
		if s := r.URL.Query().Get("limit"); s != "" {
			n, err := strconv.Atoi(s)
			if err != nil {
				writeErr(w, http.StatusBadRequest, requestID(r), "VALIDATION_ERROR", "limit must be an integer")
				return
			}
			limit = n
		}
		if s := r.URL.Query().Get("offset"); s != "" {
			n, err := strconv.Atoi(s)
			if err != nil {
				writeErr(w, http.StatusBadRequest, requestID(r), "VALIDATION_ERROR", "offset must be an integer")
				return
			}
			offset = n
		}
		if limit < 1 || limit > 100 {
			writeErr(w, http.StatusBadRequest, requestID(r), "VALIDATION_ERROR", "limit must be between 1 and 100")
			return
		}
		if offset < 0 {
			writeErr(w, http.StatusBadRequest, requestID(r), "VALIDATION_ERROR", "offset must be >= 0")
			return
		}
		page, err := st.List(r.Context(), limit, offset)
		if err != nil {
			log.Error("items list failed", "err", err.Error())
			writeErr(w, http.StatusInternalServerError, requestID(r), "INTERNAL", "Internal error")
			return
		}
		writeJSON(w, http.StatusOK, page)
	}
}

func getItem(log *slog.Logger, st store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := parseUUIDParam(w, r)
		if !ok {
			return
		}
		it, err := st.Get(r.Context(), id)
		if err != nil {
			log.Error("item get failed", "err", err.Error())
			writeErr(w, http.StatusInternalServerError, requestID(r), "INTERNAL", "Internal error")
			return
		}
		if it == nil {
			writeErr(w, http.StatusNotFound, requestID(r), "NOT_FOUND", "Item "+id+" does not exist")
			return
		}
		writeJSON(w, http.StatusOK, it)
	}
}

func createItem(log *slog.Logger, st store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Name string ` + tag('json:"name"') + `
		}
		if !decodeBody(w, r, &body) {
			return
		}
		if !validateName(w, r, body.Name) {
			return
		}
		it, err := st.Create(r.Context(), body.Name)
		if err != nil {
			log.Error("item create failed", "err", err.Error())
			writeErr(w, http.StatusInternalServerError, requestID(r), "INTERNAL", "Internal error")
			return
		}
		writeJSON(w, http.StatusCreated, it)
	}
}

func patchItem(log *slog.Logger, st store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := parseUUIDParam(w, r)
		if !ok {
			return
		}
		var body struct {
			Name string ` + tag('json:"name"') + `
		}
		if !decodeBody(w, r, &body) {
			return
		}
		if !validateName(w, r, body.Name) {
			return
		}
		it, err := st.Update(r.Context(), id, body.Name)
		if err != nil {
			log.Error("item update failed", "err", err.Error())
			writeErr(w, http.StatusInternalServerError, requestID(r), "INTERNAL", "Internal error")
			return
		}
		if it == nil {
			writeErr(w, http.StatusNotFound, requestID(r), "NOT_FOUND", "Item "+id+" does not exist")
			return
		}
		writeJSON(w, http.StatusOK, it)
	}
}

func deleteItem(log *slog.Logger, st store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := parseUUIDParam(w, r)
		if !ok {
			return
		}
		removed, err := st.Delete(r.Context(), id)
		if err != nil {
			log.Error("item delete failed", "err", err.Error())
			writeErr(w, http.StatusInternalServerError, requestID(r), "INTERNAL", "Internal error")
			return
		}
		if !removed {
			writeErr(w, http.StatusNotFound, requestID(r), "NOT_FOUND", "Item "+id+" does not exist")
			return
		}
		w.WriteHeader(http.StatusNoContent) // 204 — no body
	}
}
`
  );
}

function apiTestGo(ctx) {
  const BASE = '/api/' + ctx.name;
  return (
    `// api_test.go — convention smoke tests (pattern of services/go-svc: plain
// testing + httptest, no testify): health shape (conventions/02), error
// envelope (conventions/04), JWT guard (conventions/08 rule 4), full CRUD on
// the default resource with the in-memory store (no real database needed).
package api

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	jwtlib "github.com/golang-jwt/jwt/v5"

	"` +
    ctx.goModule +
    `/services/` +
    ctx.name +
    `/internal/store"
)

const testSecret = "test-secret-not-real-32chars-xxxxxxx"

const BASE = "` +
    BASE +
    `"

func newTestAPI(st store.Store) http.Handler {
	log := slog.New(slog.NewJSONHandler(io.Discard, nil))
	return New(log, st, testSecret)
}

func bearer() string {
	claims := jwtlib.MapClaims{
		"sub":   "11111111-1111-4111-8111-111111111111",
		"email": "alice@demo.local",
		"roles": []string{"admin"},
		"exp":   time.Now().Add(5 * time.Minute).Unix(),
	}
	tok, err := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, claims).SignedString([]byte(testSecret))
	if err != nil {
		panic(err)
	}
	return "Bearer " + tok
}

func do(t *testing.T, h http.Handler, method, target, auth, body string) *httptest.ResponseRecorder {
	t.Helper()
	var reader io.Reader
	if body != "" {
		reader = strings.NewReader(body)
	}
	req := httptest.NewRequest(method, target, reader)
	req.Header.Set("X-Request-Id", "req-test")
	if auth != "" {
		req.Header.Set("Authorization", auth)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

// assertEnvelope — the body must be the conventions/04 envelope with the given
// code and the echoed X-Request-Id.
func assertEnvelope(t *testing.T, body, code string) {
	t.Helper()
	var env struct {
		Error struct {
			Code      string ` + tag('json:"code"') + `
			RequestID string ` + tag('json:"requestId"') + `
		} ` + tag('json:"error"') + `
	}
	if err := json.Unmarshal([]byte(body), &env); err != nil {
		t.Fatalf("body is not JSON: %v — %s", err, body)
	}
	if env.Error.Code != code {
		t.Errorf("error.code = %q, want %q — body %s", env.Error.Code, code, body)
	}
	if env.Error.RequestID != "req-test" {
		t.Errorf("error.requestId = %q, want echoed X-Request-Id", env.Error.RequestID)
	}
}

func decodeItem(t *testing.T, body string) store.Item {
	t.Helper()
	var it store.Item
	if err := json.Unmarshal([]byte(body), &it); err != nil {
		t.Fatalf("item is not JSON: %v — %s", err, body)
	}
	return it
}

// failingStore — Store fake whose only failure is the readiness probe
// (go-svc fakes_test.go pattern: embed the interface, override one method).
type failingStore struct{ store.Store }

func (failingStore) Ping(context.Context) error { return errors.New("db gone") }

func TestHealthz_FixedShapeNakedAndMirror(t *testing.T) {
	h := newTestAPI(store.NewMemoryStore())
	for _, path := range []string{"/healthz", BASE + "/healthz"} {
		rec := do(t, h, http.MethodGet, path, "", "")
		if rec.Code != http.StatusOK {
			t.Fatalf("%s status = %d, want 200", path, rec.Code)
		}
		if got := strings.TrimSpace(rec.Body.String()); got != ` + tag(`{"status":"ok"}`) + ` {
			t.Errorf("%s body = %q, want fixed shape", path, got)
		}
	}
}

func TestReadyz_ProbeRealDependency(t *testing.T) {
	h := newTestAPI(store.NewMemoryStore())
	if rec := do(t, h, http.MethodGet, "/readyz", "", ""); rec.Code != http.StatusOK {
		t.Fatalf("readyz (memory store) status = %d, want 200", rec.Code)
	}
	down := newTestAPI(failingStore{store.NewMemoryStore()})
	rec := do(t, down, http.MethodGet, "/readyz", "", "")
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("readyz (dependency down) status = %d, want 503", rec.Code)
	}
	assertEnvelope(t, rec.Body.String(), "DEPENDENCY_DOWN")
}

func TestItems_NoTokenOrBadToken_401Envelope(t *testing.T) {
	h := newTestAPI(store.NewMemoryStore())
	for name, auth := range map[string]string{
		"missing":   "",
		"malformed": "Token abc",
		"invalid":   "Bearer not-a-jwt",
	} {
		rec := do(t, h, http.MethodGet, BASE+"/items", auth, "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("%s status = %d, want 401", name, rec.Code)
		}
		assertEnvelope(t, rec.Body.String(), "UNAUTHORIZED")
	}
}

func TestItems_CreateThenListThenGet(t *testing.T) {
	h := newTestAPI(store.NewMemoryStore())
	rec := do(t, h, http.MethodPost, BASE+"/items", bearer(), ` + tag(`{"name":"first task"}`) + `)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want 201 — body %s", rec.Code, rec.Body.String())
	}
	created := decodeItem(t, rec.Body.String())
	if created.Name != "first task" || created.ID == "" {
		t.Errorf("created item = %+v", created)
	}

	list := do(t, h, http.MethodGet, BASE+"/items?limit=1&offset=0", bearer(), "")
	if list.Code != http.StatusOK {
		t.Fatalf("list status = %d, want 200", list.Code)
	}
	var page store.Page
	if err := json.Unmarshal(list.Body.Bytes(), &page); err != nil {
		t.Fatalf("list body: %v — %s", err, list.Body.String())
	}
	if page.Total != 1 || len(page.Items) != 1 || page.Items[0].ID != created.ID {
		t.Errorf("page = %+v, want the created item with total 1", page)
	}

	got := do(t, h, http.MethodGet, BASE+"/items/"+created.ID, bearer(), "")
	if got.Code != http.StatusOK || decodeItem(t, got.Body.String()).ID != created.ID {
		t.Fatalf("get status = %d, want 200 with the item", got.Code)
	}
}

func TestItems_PatchUpdatesAnd404OnUnknown(t *testing.T) {
	h := newTestAPI(store.NewMemoryStore())
	created := decodeItem(t, do(t, h, http.MethodPost, BASE+"/items", bearer(), ` + tag(`{"name":"before"}`) + `).Body.String())

	patched := do(t, h, http.MethodPatch, BASE+"/items/"+created.ID, bearer(), ` + tag(`{"name":"after"}`) + `)
	if patched.Code != http.StatusOK {
		t.Fatalf("patch status = %d, want 200 — body %s", patched.Code, patched.Body.String())
	}
	it := decodeItem(t, patched.Body.String())
	if it.Name != "after" {
		t.Errorf("patched name = %q, want %q", it.Name, "after")
	}
	if !it.UpdatedAt.After(it.CreatedAt) {
		t.Errorf("updatedAt %v should move past createdAt %v", it.UpdatedAt, it.CreatedAt)
	}

	missing := do(t, h, http.MethodPatch, BASE+"/items/00000000-0000-4000-8000-000000000000", bearer(), ` + tag(`{"name":"ghost"}`) + `)
	if missing.Code != http.StatusNotFound {
		t.Fatalf("patch unknown status = %d, want 404", missing.Code)
	}
	assertEnvelope(t, missing.Body.String(), "NOT_FOUND")
}

func TestItems_Delete204ThenGetAndDelete404(t *testing.T) {
	h := newTestAPI(store.NewMemoryStore())
	created := decodeItem(t, do(t, h, http.MethodPost, BASE+"/items", bearer(), ` + tag(`{"name":"to delete"}`) + `).Body.String())

	del := do(t, h, http.MethodDelete, BASE+"/items/"+created.ID, bearer(), "")
	if del.Code != http.StatusNoContent {
		t.Fatalf("delete status = %d, want 204", del.Code)
	}
	if got := do(t, h, http.MethodGet, BASE+"/items/"+created.ID, bearer(), ""); got.Code != http.StatusNotFound {
		t.Fatalf("get after delete status = %d, want 404", got.Code)
	}
	delAgain := do(t, h, http.MethodDelete, BASE+"/items/"+created.ID, bearer(), "")
	if delAgain.Code != http.StatusNotFound {
		t.Fatalf("delete again status = %d, want 404", delAgain.Code)
	}
	assertEnvelope(t, delAgain.Body.String(), "NOT_FOUND")
}

func TestItems_ValidationErrors_400Envelope(t *testing.T) {
	h := newTestAPI(store.NewMemoryStore())
	cases := []struct {
		name   string
		method string
		target string
		body   string
	}{
		{"empty name", http.MethodPost, BASE + "/items", ` + tag(`{"name":""}`) + `},
		{"whitespace name", http.MethodPost, BASE + "/items", ` + tag(`{"name":"   "}`) + `},
		{"missing name", http.MethodPost, BASE + "/items", ` + tag(`{}`) + `},
		{"name too long", http.MethodPost, BASE + "/items", ` + tag(`{"name":"${'x'.repeat(201)}"}`) + `},
		{"bad uuid", http.MethodGet, BASE + "/items/not-a-uuid", ""},
		{"limit 0", http.MethodGet, BASE + "/items?limit=0", ""},
		{"limit too big", http.MethodGet, BASE + "/items?limit=101", ""},
		{"offset negative", http.MethodGet, BASE + "/items?offset=-1", ""},
		{"limit not a number", http.MethodGet, BASE + "/items?limit=abc", ""},
	}
	for _, tc := range cases {
		rec := do(t, h, tc.method, tc.target, bearer(), tc.body)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("%s status = %d, want 400 — body %s", tc.name, rec.Code, rec.Body.String())
			continue
		}
		assertEnvelope(t, rec.Body.String(), "VALIDATION_ERROR")
	}
}

func TestItems_UnknownRoute_404Envelope(t *testing.T) {
	h := newTestAPI(store.NewMemoryStore())
	for _, path := range []string{"/does-not-exist", BASE + "/does-not-exist"} {
		rec := do(t, h, http.MethodGet, path, bearer(), "")
		if rec.Code != http.StatusNotFound {
			t.Fatalf("%s status = %d, want 404", path, rec.Code)
		}
		assertEnvelope(t, rec.Body.String(), "NOT_FOUND")
	}
}
`
  );
}

function mainGo(ctx) {
  const dbParts = ctx.db
    ? {
        import: `\t"github.com/jackc/pgx/v5/pgxpool"\n`,
        cfg: `\tdbURL       string // DATABASE_URL — required (service has a DB — conventions/06)\n`,
        load: `\tcfg.dbURL = must("DATABASE_URL")\n`,
        store: `	// DB pool + embedded migration — readyz probes it for REAL (conventions/02 rule 2).
	poolCtx, poolCancel := context.WithTimeout(context.Background(), 30*time.Second)
	pg, err := store.NewPgStore(poolCtx, cfg.dbURL)
	poolCancel()
	if err != nil {
		log.Error("db pool open failed", "err", err.Error())
		os.Exit(1)
	}
	defer pg.Close()
	if err := pg.Migrate(context.Background()); err != nil {
		log.Error("migration failed", "err", err.Error())
		os.Exit(1)
	}
	var st store.Store = pg

`,
      }
    : {
        import: ``,
        cfg: ``,
        load: ``,
        store: `	// No database yet — the in-memory store keeps the service runnable. When the
	// database lands (--db), swap in store.NewPgStore (see internal/store/pg.go).
	st := store.NewMemoryStore()

`,
      };
  return (
    `// ` +
    ctx.name +
    ` — generated by scripts/generators gen-service (--lang go).
// Conventions: platform/conventions/ — 01 distroless (NO compose healthcheck,
// gateway depends service_started), 02 health naked+mirror with a REAL readyz
// probe, 03 slog JSON, 04 error envelope, 05 PORT env, 06 env fail-fast,
// 07 CORS dev-profile, 08 /api/<name> prefix + service-side JWT verify.
// REAL CRUD for the default \`items\` resource — swap in the real domain next
// (rename in internal/store + internal/api + contracts/openapi/` +
    ctx.name +
    `.yaml, README).
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/rs/cors"

	"` +
    ctx.goModule +
    `/services/` +
    ctx.name +
    `/internal/api"
	"` +
    ctx.goModule +
    `/services/` +
    ctx.name +
    `/internal/store"
)

const serviceName = "` +
    ctx.name +
    `"

// config — 100% env-var (conventions/06), fail-fast on missing required values.
type config struct {
	port        string
	jwtSecret   string
	corsOrigins []string
	logLevel    slog.Level
` +
    dbParts.cfg +
    `}

func loadConfig(env func(string) string) (config, error) {
	var missing []string
	must := func(key string) string {
		v := env(key)
		if strings.TrimSpace(v) == "" {
			missing = append(missing, key)
		}
		return v
	}
	cfg := config{port: env("PORT"), jwtSecret: must("JWT_SECRET")}
	if cfg.port == "" {
		cfg.port = "` +
    ctx.port +
    `" // conventions/05
	}
	if v := env("CORS_DEV_ORIGIN"); v != "" {
		for _, o := range strings.Split(v, ",") {
			if t := strings.TrimSpace(o); t != "" {
				cfg.corsOrigins = append(cfg.corsOrigins, t)
			}
		}
	}
	switch env("LOG_LEVEL") {
	case "debug":
		cfg.logLevel = slog.LevelDebug
	case "warn":
		cfg.logLevel = slog.LevelWarn
	case "error":
		cfg.logLevel = slog.LevelError
	default:
		cfg.logLevel = slog.LevelInfo
	}
` +
    dbParts.load +
    `	if len(missing) > 0 {
		return cfg, fmt.Errorf("missing required env vars: %s (platform/.env.example)", strings.Join(missing, ", "))
	}
	return cfg, nil
}

func main() {
	cfg, err := loadConfig(os.Getenv)
	if err != nil {
		// fail-fast (conventions/06 rule 6) — no silent fallback
		fmt.Fprintln(os.Stderr, "config error:", err)
		os.Exit(1)
	}
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.logLevel})).With("service", serviceName)

` +
    dbParts.store +
    `	handler := api.New(log, st, cfg.jwtSecret)

	// CORS dev-profile (conventions/07) — empty CORS_DEV_ORIGIN (compose) = no origin allowed
	handler = cors.New(cors.Options{
		AllowedOrigins: cfg.corsOrigins,
		AllowedMethods: []string{"GET", "POST", "PATCH", "DELETE"},
		AllowedHeaders: []string{"Authorization", "Content-Type", "X-Request-Id"},
	}).Handler(handler)

	srv := &http.Server{Addr: ":" + cfg.port, Handler: handler, ReadHeaderTimeout: 5 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	go func() {
		log.Info("listening", "port", cfg.port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("server failed", "err", err.Error())
			os.Exit(1)
		}
	}()
	<-ctx.Done()
	log.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}
`
  );
}

function readmeMd(ctx) {
  const dbRow = ctx.db
    ? `| DB | ${ctx.db === 'shared' ? `shared postgres, own schema \`${ctx.snake}\` + role \`${ctx.dbRole}\` (schema-per-service)` : `dedicated database \`${ctx.snake}\` + role \`${ctx.dbRole}\``} — embedded migration at boot (internal/store/migrations) + init script \`platform/postgres/init/02-${ctx.name}.sh\` |`
    : '| DB | none yet — in-memory store (internal/store); re-run gen with `--db shared|dedicated` or wire `store.NewPgStore` (pg.go pattern lives in the TS/go templates of the repo) |';
  return (
    `# ` +
    ctx.pascal +
    ` (` +
    ctx.name +
    `) — Go

Generated by \`scripts/generators/gen-service.mjs\` (--lang go). The scaffold follows the conventions — working CRUD included; swap in the real domain next.

| Item | Value |
|---|---|
| Port | ` +
    ctx.port +
    ` (env \`PORT\` — conventions/05) |
| Health | \`/healthz\` + \`/readyz\` naked + mirror \`/api/` +
    ctx.name +
    `/*\` — readyz probes the store for REAL (conventions/02) |
| Compose | NO healthcheck — distroless has no shell/wget (rule 3); gateway depends \`service_started\` |
| Contract | \`contracts/openapi/` +
    ctx.name +
    `.yaml\` (generated with real CRUD paths — edit FIRST when changing the domain) |
` +
    dbRow +
    ` |
| Auth | JWT HS256 verified in-service (internal/api jwtGuard); gateway presence-checks only |

## Endpoints (default resource \`items\` — rename to the real domain)

| Method | Path | Notes |
|---|---|---|
| GET | \`/api/` +
    ctx.name +
    `/items?limit&offset\` | paginated \`{items,total}\`, newest first (tasks pattern) |
| GET | \`/api/` +
    ctx.name +
    `/items/:id\` | 200 / 404 envelope |
| POST | \`/api/` +
    ctx.name +
    `/items\` | body \`{name}\` → 201 |
| PATCH | \`/api/` +
    ctx.name +
    `/items/:id\` | body \`{name}\` → 200 / 404 |
| DELETE | \`/api/` +
    ctx.name +
    `/items/:id\` | 204 / 404 |

## Layout

| Path | Role |
|---|---|
| \`cmd/server/main.go\` | env fail-fast → store wiring → router + CORS + graceful shutdown |
| \`internal/api/\` | router, error envelope, JWT guard, CRUD handlers, httptest suite |
| \`internal/store/\` | \`Store\` seam: MemoryStore (tests + no-db)` +
    (ctx.db ? ' + PgStore (pgx) with the embedded migration' : '') +
    ` |

## Run

\`\`\`bash
# generate go.sum once, then build + test
cd services/` +
    ctx.name +
    ` && go mod tidy
go test ./... # convention smoke + CRUD (in-memory store, httptest)
go build ./...
\`\`\`

` +
    (ctx.db
      ? `Database: \`docker compose -f platform/docker-compose.yml --env-file platform/.env.example up -d postgres ` +
        ctx.name +
        `\` — the embedded migration creates the table at boot if missing; on a FRESH volume the init script creates schema/role/table.\n\n`
      : '') +
    `## Next steps (AI directives)

1. Rename the resource: edit \`contracts/openapi/` +
    ctx.name +
    `.yaml\` FIRST → \`pnpm lint:contracts\` → update \`internal/store/store.go\`` +
    (ctx.db ? ' (+ `pg.go` + `migrations/`)' : '') +
    ` + \`internal/api/items.go\`.
2. Keep \`readyz\` probing REAL dependencies (Store.Ping today).
3. See the generator \`next_steps\` JSON for the full remaining checklist.
`
  );
}

/** Returns { relPath: content } — every file of the Go service. */
export function serviceGoFiles(ctx) {
  const files = {
    'go.mod': goMod(ctx),
    'cmd/server/main.go': mainGo(ctx),
    'internal/api/api.go': apiGo(ctx),
    'internal/api/items.go': itemsGo(ctx),
    'internal/api/api_test.go': apiTestGo(ctx),
    'internal/store/store.go': storeGo(ctx),
    Dockerfile: dockerfile(ctx),
    '.dockerignore': 'bin/\n',
    'README.md': readmeMd(ctx),
  };
  if (ctx.db) {
    files['internal/store/pg.go'] = pgGo(ctx);
    files['internal/store/migrations/0001_create_items.sql'] = migrationSql(ctx);
  }
  return files;
}
