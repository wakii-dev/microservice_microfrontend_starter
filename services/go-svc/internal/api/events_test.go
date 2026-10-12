package api

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
)

// postEvents helper — dựng handler + POST body JSON.
func postEvents(t *testing.T, store EventStore, resolver DisplayResolver, tasks TaskReader, body string) *httptest.ResponseRecorder {
	t.Helper()
	h := &EventsHandler{Store: store, Resolver: resolver, Tasks: tasks, Log: slog.Default()}
	req := httptest.NewRequest(http.MethodPost, "/api/activity/events", strings.NewReader(body))
	req = req.WithContext(contextWithRequestID(req, "req-ev"))
	rec := httptest.NewRecorder()
	h.Ingest(rec, req)
	return rec
}

func TestEventsIngest_Valid202Accepted(t *testing.T) {
	store := &fakeStore{}
	resolver := fakeResolver{name: "Alice Demo"}
	tasks := &fakeTasks{titles: map[uuid.UUID]string{}}
	tasks.titles[mustUUID("9f0e0000-0000-4000-8000-000000000001")] = "Sample task"

	rec := postEvents(t, store, resolver, tasks, `{
		"taskId": "9f0e0000-0000-4000-8000-000000000001",
		"userId": "11111111-1111-4111-8111-111111111111",
		"action": "task.created",
		"timestamp": "2026-10-12T05:00:00Z"
	}`)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "\"accepted\":true") {
		t.Errorf("body = %q, want accepted:true", rec.Body.String())
	}
	if len(store.events) != 1 {
		t.Fatalf("store has %d events, want 1", len(store.events))
	}
	ev := store.events[0]
	if ev.UserName != "Alice Demo" {
		t.Errorf("UserName = %q, want Alice Demo", ev.UserName)
	}
	if ev.TaskTitle != "Sample task" {
		t.Errorf("TaskTitle = %q, want Sample task", ev.TaskTitle)
	}
}

func TestEventsIngest_ValidationMatrix(t *testing.T) {
	store := &fakeStore{}
	resolver := fakeResolver{name: ""}
	tasks := &fakeTasks{}

	cases := []struct {
		name string
		body string
	}{
		{"bad json", `{not-json`},
		{"bad taskId", `{"taskId":"x","userId":"11111111-1111-4111-8111-111111111111","action":"task.created","timestamp":"2026-10-12T05:00:00Z"}`},
		{"bad userId", `{"taskId":"9f0e0000-0000-4000-8000-000000000001","userId":"y","action":"task.created","timestamp":"2026-10-12T05:00:00Z"}`},
		{"bad action", `{"taskId":"9f0e0000-0000-4000-8000-000000000001","userId":"11111111-1111-4111-8111-111111111111","action":"task.nuked","timestamp":"2026-10-12T05:00:00Z"}`},
		{"bad timestamp", `{"taskId":"9f0e0000-0000-4000-8000-000000000001","userId":"11111111-1111-4111-8111-111111111111","action":"task.created","timestamp":"khong-phai-rfc3339"}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := postEvents(t, store, resolver, tasks, tc.body)
			if rec.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want 400", rec.Code)
			}
			assertEnvelope(t, rec.Body.String(), CodeValidationError, "req-ev")
		})
	}
	if len(store.events) != 0 {
		t.Errorf("no event should persist on validation errors, got %d", len(store.events))
	}
}

func TestEventsIngest_DegradedResolversStillIngest(t *testing.T) {
	// spring + tasks schema down → vẫn ingest với display fields rỗng
	store := &fakeStore{}
	resolver := fakeResolver{name: ""}
	tasks := &fakeTasks{unavail: true}

	rec := postEvents(t, store, resolver, tasks, `{
		"taskId": "9f0e0000-0000-4000-8000-000000000001",
		"userId": "11111111-1111-4111-8111-111111111111",
		"action": "task.updated",
		"timestamp": "2026-10-12T05:00:00Z"
	}`)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202 (fire-and-forget: degrade KHÔNG chặn ingest)", rec.Code)
	}
	if store.events[0].UserName != "" || store.events[0].TaskTitle != "" {
		t.Errorf("degraded fields should be empty, got %q/%q", store.events[0].UserName, store.events[0].TaskTitle)
	}
}
