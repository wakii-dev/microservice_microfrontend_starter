package consumer

// handler_test.go — unit handler không broker: golden fixture → activity row
// đúng; filter-by-type skip; fail hook deterministic; envelope id KHÔNG bị sinh mới.

import (
	"context"
	"log/slog"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/resolve"
)

// fakeEventStore — bắt event consumer insert (fake riêng của package consumer —
// không đụng fakes_test.go của package api).
type fakeEventStore struct {
	mu     sync.Mutex
	events []model.Event
	err    error
}

func (f *fakeEventStore) InsertEvent(_ context.Context, e *model.Event) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.err != nil {
		return f.err
	}
	f.events = append(f.events, *e)
	return nil
}

type fakeTaskTitles struct{ titles map[uuid.UUID]string }

func (f fakeTaskTitles) TaskTitle(_ context.Context, id uuid.UUID) (string, error) {
	return f.titles[id], nil
}

func newTestHandler(store *fakeEventStore) *Handler {
	return &Handler{
		Store:    store,
		Tasks:    fakeTaskTitles{titles: map[uuid.UUID]string{"c7c7c7c7-7777-4777-8777-777777777777": "Ship Kafka foundation"}},
		Resolver: resolve.New("http://spring-unused"), // không token source → userName "" (degraded)
		Log:      slog.Default(),
	}
}

func TestHandler_GoldenAssignedFixtureInsertsWithEnvelopeID(t *testing.T) {
	store := &fakeEventStore{}
	h := newTestHandler(store)

	env, err := ParseEnvelope(loadFixture(t, "task.assigned.json"))
	if err != nil {
		t.Fatalf("parse fixture: %v", err)
	}
	if err := h.Handle(context.Background(), env); err != nil {
		t.Fatalf("handle: %v", err)
	}
	if len(store.events) != 1 {
		t.Fatalf("events = %d, want 1", len(store.events))
	}
	ev := store.events[0]
	if ev.ID != env.ID {
		t.Errorf("event id = %s, want envelope id %s (KHÔNG sinh mới — khóa idempotency)", ev.ID, env.ID)
	}
	if ev.Action != model.ActionTaskAssigned {
		t.Errorf("action = %q", ev.Action)
	}
	if ev.TaskTitle != "Ship Kafka foundation" {
		t.Errorf("taskTitle = %q, want từ readonly lookup", ev.TaskTitle)
	}
	if !ev.Timestamp.Equal(env.OccurredAt.UTC()) {
		t.Errorf("timestamp = %v, want occurredAt %v", ev.Timestamp, env.OccurredAt)
	}
}

func TestHandler_SkipsAssignmentFailedByType(t *testing.T) {
	store := &fakeEventStore{}
	h := newTestHandler(store)

	env, err := ParseEnvelope(loadFixture(t, "task.assignment_failed.json"))
	if err != nil {
		t.Fatalf("parse fixture: %v", err)
	}
	if err := h.Handle(context.Background(), env); err != nil {
		t.Fatalf("filter-by-type phải SKIP (nil), got %v", err)
	}
	if len(store.events) != 0 {
		t.Errorf("assignment_failed KHÔNG được ghi activity, got %d rows", len(store.events))
	}
}

func TestHandler_FailHookSvcFailDeterministic(t *testing.T) {
	store := &fakeEventStore{}
	h := newTestHandler(store)

	// Fixture task.assigned có assigneeId = bob — không fail. Thay assigneeId
	// = svc-fail (55555555-...) → Handle PHẢI fail deterministic (saga e2e).
	raw, err := ParseEnvelope(loadFixture(t, "task.assigned.json"))
	if err != nil {
		t.Fatalf("parse fixture: %v", err)
	}
	raw.Payload = []byte(`{"taskId":"c7c7c7c7-7777-4777-8777-777777777777","userId":"11111111-1111-4111-8111-111111111111","assigneeId":"55555555-5555-4555-8555-555555555555"}`)

	if err := h.Handle(context.Background(), raw); err == nil {
		t.Fatal("assigneeId = svc-fail → Handle phải fail (simulate hook)")
	}
	if len(store.events) != 0 {
		t.Errorf("fail hook KHÔNG được ghi activity, got %d rows", len(store.events))
	}
}

func TestHandler_PayloadMissingFieldsRejected(t *testing.T) {
	store := &fakeEventStore{}
	h := newTestHandler(store)

	env := Envelope{
		SchemaVersion: 1,
		ID:            uuid.New(),
		Type:          model.ActionTaskCreated,
		OccurredAt:    time.Now().UTC(),
		Payload:       []byte(`{"taskId":"c7c7c7c7-7777-4777-8777-777777777777"}`), // thiếu userId
	}
	if err := h.Handle(context.Background(), env); err == nil {
		t.Fatal("payload thiếu userId phải fail")
	}
	if len(store.events) != 0 {
		t.Errorf("không được insert khi payload thiếu field bắt buộc, got %d", len(store.events))
	}
}
