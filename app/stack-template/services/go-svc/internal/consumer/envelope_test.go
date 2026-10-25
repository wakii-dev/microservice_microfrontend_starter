package consumer

// envelope_test.go — golden fixtures (contracts/events/fixtures, READ-ONLY)
// là hợp đồng machine-checkable: consumer PHẢI parse được cả 5 file, KHÔNG
// tự bịa envelope (context pack sf-3).

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

// fixturesDir — absolute path contracts/events/fixtures từ package này.
func fixturesDir(t *testing.T) string {
	t.Helper()
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot locate test file")
	}
	dir := filepath.Join(filepath.Dir(thisFile), "..", "..", "..", "..", "contracts", "events", "fixtures")
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		t.Skip("contracts/events/fixtures không tồn tại cạnh service (standalone copy) — skip golden fixture test")
	}
	return dir
}

func loadFixture(t *testing.T, name string) []byte {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join(fixturesDir(t), name))
	if err != nil {
		t.Fatalf("read fixture %s: %v", name, err)
	}
	return raw
}

func TestParseEnvelope_AllGoldenFixtures(t *testing.T) {
	cases := []struct {
		file string
		want string
	}{
		{"task.created.json", model.ActionTaskCreated},
		{"task.updated.json", model.ActionTaskUpdated},
		{"task.assigned.json", model.ActionTaskAssigned},
		{"task.deleted.json", model.ActionTaskDeleted},
		{"task.assignment_failed.json", model.ActionTaskAssignmentFailed},
	}
	for _, tc := range cases {
		t.Run(tc.file, func(t *testing.T) {
			env, err := ParseEnvelope(loadFixture(t, tc.file))
			if err != nil {
				t.Fatalf("parse golden fixture %s: %v", tc.file, err)
			}
			if env.Type != tc.want {
				t.Errorf("type = %q, want %q", env.Type, tc.want)
			}
			if env.SchemaVersion != 1 {
				t.Errorf("schemaVersion = %d, want 1", env.SchemaVersion)
			}
			if env.ID == uuid.Nil {
				t.Error("id rỗng — fixtures phải mang envelope id")
			}
			if env.OccurredAt.IsZero() {
				t.Error("occurredAt zero")
			}
		})
	}
}

// TestParseEnvelope_AssignedFixturePayload — fail hook + activity row dùng
// đúng assigneeId/userId của fixture (không bịa).
func TestParseEnvelope_AssignedFixturePayload(t *testing.T) {
	env, err := ParseEnvelope(loadFixture(t, "task.assigned.json"))
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	var p taskUserPayload
	if err := json.Unmarshal(env.Payload, &p); err != nil {
		t.Fatalf("decode payload: %v", err)
	}
	if p.TaskID.String() != "c7c7c7c7-7777-4777-8777-777777777777" {
		t.Errorf("taskId = %s", p.TaskID)
	}
	if p.UserID.String() != "11111111-1111-4111-8111-111111111111" {
		t.Errorf("userId = %s (alice fixture)", p.UserID)
	}
	if p.AssigneeID.String() != "22222222-2222-4222-8222-222222222222" {
		t.Errorf("assigneeId = %s (bob fixture — KHÔNG phải svc-fail)", p.AssigneeID)
	}
}

func TestParseEnvelope_InvalidMatrix(t *testing.T) {
	cases := []struct {
		name string
		raw  string
	}{
		{"not json", `{nope`},
		{"wrong schemaVersion", `{"schemaVersion":2,"id":"` + uuid.New().String() + `","type":"task.created","occurredAt":"2026-10-13T09:00:00Z","payload":{}}`},
		{"missing id", `{"schemaVersion":1,"type":"task.created","occurredAt":"2026-10-13T09:00:00Z","payload":{}}`},
		{"unknown type", `{"schemaVersion":1,"id":"` + uuid.New().String() + `","type":"task.nuked","occurredAt":"2026-10-13T09:00:00Z","payload":{}}`},
		{"missing occurredAt", `{"schemaVersion":1,"id":"` + uuid.New().String() + `","type":"task.created","payload":{}}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := ParseEnvelope([]byte(tc.raw)); err == nil {
				t.Errorf("ParseEnvelope(%s) = nil error, want fail", tc.name)
			}
		})
	}
}

func TestCompensatingEnvelope_NewIDAndShape(t *testing.T) {
	taskID := uuid.MustParse("c7c7c7c7-7777-4777-8777-777777777777")
	assignee := FailUserID
	env := CompensatingEnvelope(taskID, assignee, "retry x3 het", time.Now())
	if env.Type != model.ActionTaskAssignmentFailed {
		t.Errorf("type = %q", env.Type)
	}
	if env.ID == uuid.Nil {
		t.Error("compensating id phải MỚI (go sinh — producer lúc này)")
	}
	raw, err := env.Marshal()
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	back, err := ParseEnvelope(raw)
	if err != nil {
		t.Fatalf("round-trip parse: %v", err)
	}
	if back.ID != env.ID || back.Type != env.Type {
		t.Errorf("round-trip lệch: %+v vs %+v", back, env)
	}
}

func TestNewDLQMessage_WrapsOriginal(t *testing.T) {
	original := []byte(`{"schemaVersion":1}`)
	now := time.Now()
	m := NewDLQMessage(original, "boom", 3, now)
	if m.SchemaVersion != 1 {
		t.Errorf("schemaVersion = %d, want 1", m.SchemaVersion)
	}
	if string(m.OriginalEvent) != string(original) {
		t.Errorf("originalEvent = %s, want nguyên văn message gốc", m.OriginalEvent)
	}
	if m.Error.Reason != "boom" || m.Error.Retries != 3 || m.Error.FailedAt.IsZero() {
		t.Errorf("DLQError = %+v, want reason/retries/failedAt đủ", m.Error)
	}
}
