//go:build integration

// Integration tests SF-4 (FI-72) — readonly-exit criterion + API roundtrip.
// Chạy trong CI (services-go-svc/build-test) với postgres service container +
// init script thật (schemas + roles + ALTER DEFAULT PRIVILEGES FOR ROLE node_svc).
//
// Điểm mấu chốt (plan rev 2 P0-1 + plan-critic P2): canonical DDL phải được
// apply BẰNG ROLE node_svc — ALTER DEFAULT PRIVILEGES chỉ hiệu lực cho bảng do
// node_svc tạo; bảng do superuser tạo thì go_readonly không thấy → test giả.
//
// Env: GO_TEST_ADMIN_URL (boilerplate superuser), GO_TEST_NODE_URL (node_svc),
// GO_TEST_GO_URL (go_svc), GO_TEST_READONLY_URL (go_readonly), GO_TEST_JWT_SECRET.
package integration

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/api"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/apperr"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/consumer"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/resolve"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/store"
)

const aliceID = "11111111-1111-4111-8111-111111111111" // users fixture

func envURL(t *testing.T, key string) string {
	t.Helper()
	v := os.Getenv(key)
	if v == "" {
		t.Fatalf("missing env %s (chỉ chạy trong CI services-go-svc/build-test hoặc local có postgres)", key)
	}
	return v
}

// openDB helper — open + ping, fail test khi không connect được.
func openDB(t *testing.T, url string) *sql.DB {
	t.Helper()
	db, err := sql.Open("pgx", url)
	if err != nil {
		t.Fatalf("open %s: %v", url, err)
	}
	if err := db.PingContext(context.Background()); err != nil {
		t.Fatalf("ping %s: %v", url, err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

// splitStatements tách SQL file thành statements đơn (DDL không có function body;
// bỏ comment line — đủ an toàn cho canonical DDL + migration của mình).
// Bỏ statement CREATE SCHEMA: schema đã có từ init script — node_svc không có
// CREATE trên DATABASE nên CREATE SCHEMA IF NOT EXISTS vẫn permission-denied
// (CI boot-smoke cũng grep -v tương tự).
func splitStatements(t *testing.T, content string) []string {
	t.Helper()
	var lines []string
	for _, l := range strings.Split(content, "\n") {
		trimmed := strings.TrimSpace(l)
		if trimmed == "" || strings.HasPrefix(trimmed, "--") || strings.HasPrefix(trimmed, "CREATE SCHEMA") {
			continue
		}
		lines = append(lines, l)
	}
	cleaned := strings.Join(lines, "\n")
	var out []string
	for _, s := range strings.Split(cleaned, ";") {
		if strings.TrimSpace(s) != "" {
			out = append(out, s)
		}
	}
	return out
}

// mustReadFile đọc file relative từ services/go-svc/test/integration.
func mustReadFile(t *testing.T, rel string) string {
	t.Helper()
	b, err := os.ReadFile(rel)
	if err != nil {
		t.Fatalf("read %s: %v", rel, err)
	}
	return string(b)
}

// setupTasksAsNodeSvc — apply canonical DDL + seed bằng ROLE node_svc
// (đúng scenario production: migration node-svc chạy bằng node_svc).
func setupTasksAsNodeSvc(t *testing.T) (taskIDs []uuid.UUID) {
	t.Helper()
	nodeDB := openDB(t, envURL(t, "GO_TEST_NODE_URL"))

	ddl := mustReadFile(t, filepathContractsTasksSchema())
	for _, stmt := range splitStatements(t, ddl) {
		if _, err := nodeDB.Exec(stmt); err != nil {
			t.Fatalf("apply canonical DDL as node_svc: %v\nstmt: %s", err, stmt)
		}
	}

	// seed 3 tasks: 2 todo + 1 done — exit criterion stats đúng
	taskIDs = []uuid.UUID{uuid.New(), uuid.New(), uuid.New()}
	seeds := []struct {
		id     uuid.UUID
		status string
	}{
		{taskIDs[0], "todo"},
		{taskIDs[1], "todo"},
		{taskIDs[2], "done"},
	}
	for _, s := range seeds {
		_, err := nodeDB.Exec(
			`INSERT INTO tasks.tasks (id, title, description, status, created_by)
			 VALUES ($1, $2, NULL, $3, $4)`,
			s.id, "Task "+s.id.String()[:8], s.status, mustUUID(t, aliceID))
		if err != nil {
			t.Fatalf("seed task as node_svc: %v", err)
		}
	}

	// plan-critic P2: assert tableowner = node_svc — chặn shortcut "DDL bằng
	// superuser + grant tay" âm thầm phá bằng chứng permission boundary
	adminDB := openDB(t, envURL(t, "GO_TEST_ADMIN_URL"))
	var owner string
	if err := adminDB.QueryRow(
		`SELECT tableowner FROM pg_tables WHERE schemaname='tasks' AND tablename='tasks'`).Scan(&owner); err != nil {
		t.Fatalf("read tableowner: %v", err)
	}
	if owner != "node_svc" {
		t.Fatalf("tableowner = %q, want node_svc — DDL phải apply bằng node_svc (default privileges)", owner)
	}
	return taskIDs
}

// repoRoot — absolute path repo root (robust hơn relative: go test CWD =
// package dir nhưng không nên dựa vào đó khi copy-dir/CI layout khác nhau).
func repoRoot() string {
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		return "."
	}
	// test/integration → services/go-svc → services → repo root (4 cấp)
	return filepath.Join(filepath.Dir(thisFile), "..", "..", "..", "..")
}

func filepathContractsTasksSchema() string {
	return filepath.Join(repoRoot(), "contracts", "db", "tasks-schema.sql")
}

func mustUUID(t *testing.T, s string) uuid.UUID {
	t.Helper()
	return uuid.MustParse(s)
}

// grantReadonly / revokeReadonly — toggle grant SELECT go_readonly (owner role).
func grantReadonly(t *testing.T, grant bool) {
	t.Helper()
	nodeDB := openDB(t, envURL(t, "GO_TEST_NODE_URL"))
	stmt := `REVOKE SELECT ON tasks.tasks FROM go_readonly`
	if grant {
		stmt = `GRANT SELECT ON tasks.tasks TO go_readonly`
	}
	if _, err := nodeDB.Exec(stmt); err != nil {
		t.Fatalf("%s: %v", stmt, err)
	}
}

// newAppStore — store thật nối 2 pool (go_svc owner + go_readonly).
func newAppStore(t *testing.T) *store.Store {
	t.Helper()
	st, err := store.Open(context.Background(),
		envURL(t, "GO_TEST_GO_URL"), envURL(t, "GO_TEST_READONLY_URL"), slog.Default())
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	t.Cleanup(func() { st.Close() })
	if err := st.Migrate(context.Background()); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return st
}

// mintJWT — token hợp lệ theo token contract (iss auth-mock, TTL 8h).
func mintJWT(t *testing.T, secret string) string {
	t.Helper()
	now := time.Now().Unix()
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": aliceID, "email": "alice@demo.local", "roles": []string{"admin"},
		"iss": "auth-mock", "iat": now, "exp": now + 28800,
	})
	s, err := tok.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("sign jwt: %v", err)
	}
	return s
}

// fakeSpring — spring-svc giả trả displayName (resolver path thật qua HTTP).
func fakeSpring(t *testing.T) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/users/"+aliceID {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"id":"` + aliceID + `","email":"alice@demo.local","displayName":"Alice Demo","roles":["admin"]}`))
	}))
	t.Cleanup(srv.Close)
	return srv
}

// TestReadonlyExitCriterion — EXIT CRITERION context pack:
// seed rows bằng owner role → stats trả về đúng; mất grant → fail rõ ràng.
func TestReadonlyExitCriterion(t *testing.T) {
	taskIDs := setupTasksAsNodeSvc(t)
	st := newAppStore(t)

	// 1) readonly đọc được → stats đúng
	ts, err := st.Stats(context.Background())
	if err != nil {
		t.Fatalf("stats với grant đúng: %v", err)
	}
	if ts.TotalTasks < 3 {
		t.Errorf("totalTasks = %d, want >= 3 (seeded)", ts.TotalTasks)
	}
	if ts.ByStatus["todo"] < 2 || ts.ByStatus["done"] < 1 {
		t.Errorf("tasksByStatus = %v, want todo>=2 done>=1", ts.ByStatus)
	}

	// 2) REVOKE SELECT → ErrTasksUnavailable (handler map 503)
	grantReadonly(t, false)
	_, err = st.Stats(context.Background())
	if !errIs(err, apperr.ErrTasksUnavailable) {
		t.Fatalf("stats sau REVOKE: err = %v, want ErrTasksUnavailable", err)
	}
	if err := st.Probe(context.Background()); !errIs(err, apperr.ErrTasksUnavailable) {
		t.Fatalf("probe sau REVOKE: err = %v, want ErrTasksUnavailable", err)
	}

	// 3) GRANT lại → đọc được (test isolation)
	grantReadonly(t, true)
	if _, err := st.Stats(context.Background()); err != nil {
		t.Fatalf("stats sau re-grant: %v", err)
	}

	_ = taskIDs
}

// TestAPIRoundtrip — consumer ghi event (thay POST /events đã thanh lý) →
// feed chứa event + display fields → stats; POST /events → 404; 401 paths.
func TestAPIRoundtrip(t *testing.T) {
	taskIDs := setupTasksAsNodeSvc(t)
	st := newAppStore(t)
	secret := envURL(t, "GO_TEST_JWT_SECRET")
	resolver := resolve.New(fakeSpring(t).URL)

	router := api.NewRouter(api.Deps{
		Log:         slog.Default(),
		Readiness:   st,
		CORSOrigins: nil,
		JWTSecret:   []byte(secret),
		Feed:        &api.FeedHandler{Store: st, Resolver: resolver, Tasks: st, Log: slog.Default()},
		Stats:       &api.StatsHandler{Store: st, Tasks: st, Log: slog.Default()},
	})
	srv := httptest.NewServer(router)
	t.Cleanup(srv.Close)

	token := mintJWT(t, secret)

	// 401 — không token / token sai (service tự verify, không phụ thuộc gateway)
	res, _ := do(t, http.MethodGet, srv.URL+"/api/activity/feed", "")
	if res != http.StatusUnauthorized {
		t.Errorf("feed no-token = %d, want 401", res)
	}
	res, _ = do(t, http.MethodGet, srv.URL+"/api/activity/stats", "Bearer garbage")
	if res != http.StatusUnauthorized {
		t.Errorf("stats bad-token = %d, want 401", res)
	}

	// Consumer path (thay REST ingest): golden fixture task.created → handler
	// ghi activity bằng envelope id — feed thấy ngay
	env, err := consumer.ParseEnvelope(loadGoldenFixture(t, "task.created.json"))
	if err != nil {
		t.Fatalf("parse golden fixture: %v", err)
	}
	// Trỏ payload taskId về seed task[0] để assert taskTitle readonly lookup
	created := consumer.Envelope{
		SchemaVersion: env.SchemaVersion,
		ID:            env.ID,
		Type:          env.Type,
		OccurredAt:    env.OccurredAt,
		Payload:       json.RawMessage(fmt.Sprintf(`{"taskId":%q,"userId":%q,"title":"Ship Kafka foundation","status":"todo"}`, taskIDs[0].String(), aliceID)),
	}
	handler := &consumer.Handler{Store: st, Tasks: st, Resolver: resolver, Log: slog.Default()}
	if err := handler.Handle(context.Background(), created); err != nil {
		t.Fatalf("consumer handle: %v", err)
	}

	// GET /feed — event mới nhất + display fields resolved
	req, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/activity/feed?limit=5", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("GET /feed: %v", err)
	}
	feedBody := readBody(t, resp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /feed = %d — body: %s", resp.StatusCode, feedBody)
	}
	var feed struct {
		Items []struct {
			ID        string `json:"id"`
			TaskID    string `json:"taskId"`
			UserName  string `json:"userName"`
			TaskTitle string `json:"taskTitle"`
			Action    string `json:"action"`
		} `json:"items"`
		Total int `json:"total"`
	}
	if err := json.Unmarshal([]byte(feedBody), &feed); err != nil {
		t.Fatalf("feed json: %v — %s", err, feedBody)
	}
	if len(feed.Items) == 0 {
		t.Fatalf("feed rỗng — consumer không ghi được event (acceptance)")
	}
	top := feed.Items[0]
	if top.ID != created.ID.String() {
		t.Errorf("feed id = %s, want envelope id %s (khóa idempotency)", top.ID, created.ID)
	}
	if top.TaskID != taskIDs[0].String() {
		t.Errorf("feed top taskId = %s, want %s", top.TaskID, taskIDs[0])
	}
	if top.UserName != "Alice Demo" {
		t.Errorf("userName = %q, want Alice Demo (spring resolver)", top.UserName)
	}
	if top.TaskTitle != "Task "+taskIDs[0].String()[:8] {
		t.Errorf("taskTitle = %q, want seeded title", top.TaskTitle)
	}

	// Thanh lý ingest — POST /events KHÔNG còn (acceptance sf-3)
	req, _ = http.NewRequest(http.MethodPost, srv.URL+"/api/activity/events", strings.NewReader(`{}`))
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("POST /events: %v", err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("POST /events = %d, want 404 (REST ingest đã thanh lý)", resp.StatusCode)
	}

	// GET /stats — phản ánh rows seeded + recentEvents (4 keys — SF-3 nới)
	req, _ = http.NewRequest(http.MethodGet, srv.URL+"/api/activity/stats", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("GET /stats: %v", err)
	}
	statsBody := readBody(t, resp)
	var stats struct {
		TotalTasks    int            `json:"totalTasks"`
		TasksByStatus map[string]int `json:"tasksByStatus"`
		RecentEvents  int            `json:"recentEvents"`
	}
	if err := json.Unmarshal([]byte(statsBody), &stats); err != nil {
		t.Fatalf("stats json: %v — %s", err, statsBody)
	}
	if stats.TotalTasks < 3 {
		t.Errorf("stats.totalTasks = %d, want >= 3 (exit criterion readonly đọc được)", stats.TotalTasks)
	}
	if _, ok := stats.TasksByStatus["assignment_failed"]; !ok {
		t.Errorf("stats.tasksByStatus thiếu assignment_failed — key thứ 4 (SF-3 nới): %v", stats.TasksByStatus)
	}
	if stats.RecentEvents < 1 {
		t.Errorf("stats.recentEvents = %d, want >= 1 (consumer vừa ghi)", stats.RecentEvents)
	}

	// /readyz — 200 khi migration xong + readonly probe OK
	res, readyBody := do(t, http.MethodGet, srv.URL+"/readyz", "")
	if res != http.StatusOK || !strings.Contains(readyBody, `"status":"ok"`) {
		t.Errorf("readyz = %d %s, want 200 ok", res, readyBody)
	}

	// swagger docs — auth-exempt trên service
	res, _ = do(t, http.MethodGet, srv.URL+"/api/activity/docs", "")
	if res != http.StatusOK {
		t.Errorf("docs = %d, want 200 (auth-exempt)", res)
	}
	res, specBody := do(t, http.MethodGet, srv.URL+"/api/activity/openapi.yaml", "")
	if res != http.StatusOK || !strings.Contains(specBody, "Activity API") {
		t.Errorf("openapi.yaml = %d, want 200 với spec content", res)
	}
}

// TestConsumerIdempotencyRealPG — ACCEPTANCE: duplicate envelope id → VẪN 1 row
// (ON CONFLICT DO NOTHING) + action 22 ký tự (varchar(40) migration 0002).
func TestConsumerIdempotencyRealPG(t *testing.T) {
	setupTasksAsNodeSvc(t)
	st := newAppStore(t)
	ctx := context.Background()

	env, err := consumer.ParseEnvelope(loadGoldenFixture(t, "task.assigned.json"))
	if err != nil {
		t.Fatalf("parse fixture: %v", err)
	}
	handler := &consumer.Handler{Store: st, Tasks: st, Resolver: resolve.New("http://spring-unused"), Log: slog.Default()}

	if err := handler.Handle(ctx, env); err != nil {
		t.Fatalf("handle lần 1: %v", err)
	}
	// Redelivery cùng envelope id (at-least-once) — handler phải nil-error,
	// DB DO NOTHING: total KHÔNG tăng
	if err := handler.Handle(ctx, env); err != nil {
		t.Fatalf("handle redelivery: %v", err)
	}
	_, total, err := st.ListEvents(ctx, 100, 0)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if total != 1 {
		t.Errorf("total = %d, want 1 — duplicate envelope id KHÔNG được nhân đôi feed (idempotency)", total)
	}

	// Width varchar(40): action task.assignment_failed = 22 ký tự phải insert
	// được (chỉ sửa CHECK quên width = chết runtime — P0 context pack)
	wide := model.Event{
		ID:        uuid.MustParse("9e8d7c6b-5a49-4837-a615-24f3e2d1c0b9"),
		TaskID:    uuid.MustParse("c7c7c7c7-7777-4777-8777-777777777777"),
		UserID:    mustUUID(t, aliceID),
		Action:    model.ActionTaskAssignmentFailed,
		Timestamp: time.Now().UTC(),
	}
	if err := st.InsertEvent(ctx, &wide); err != nil {
		t.Fatalf("insert action 22 ký tự: %v (migration 0002 varchar(40) chưa áp?)", err)
	}
}

// loadGoldenFixture — đọc contracts/events/fixtures (READ-ONLY, task-events.md:
// consumer test load chung golden fixtures — KHÔNG tự bịa envelope).
func loadGoldenFixture(t *testing.T, name string) []byte {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join(repoRoot(), "contracts", "events", "fixtures", name))
	if err != nil {
		t.Fatalf("read golden fixture %s: %v", name, err)
	}
	return raw
}

// TestReadyz503WhenTasksUnreadable — conventions/02 rule 2: readyz kiểm THẬT.
func TestReadyz503WhenTasksUnreadable(t *testing.T) {
	setupTasksAsNodeSvc(t)
	st := newAppStore(t)

	grantReadonly(t, false)
	defer grantReadonly(t, true)

	if err := st.Ready(); !errIs(err, apperr.ErrTasksUnavailable) {
		t.Fatalf("Ready() sau REVOKE = %v, want ErrTasksUnavailable", err)
	}
}

// --- helpers chung ---

func errIs(err, target error) bool {
	for e := err; e != nil; {
		if e == target {
			return true
		}
		type unwrapper interface{ Unwrap() error }
		u, ok := e.(unwrapper)
		if !ok {
			return false
		}
		e = u.Unwrap()
	}
	return false
}

func do(t *testing.T, method, url, auth string) (int, string) {
	t.Helper()
	req, _ := http.NewRequest(method, url, nil)
	if auth != "" {
		req.Header.Set("Authorization", auth)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("%s %s: %v", method, url, err)
	}
	defer resp.Body.Close()
	return resp.StatusCode, readBody(t, resp)
}

func readBody(t *testing.T, resp *http.Response) string {
	t.Helper()
	buf := make([]byte, 65536)
	n, _ := resp.Body.Read(buf)
	return string(buf[:n])
}
