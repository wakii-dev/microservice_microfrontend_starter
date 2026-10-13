package consumer

// runner_test.go — retry/DLQ semantics không broker (seam MessageSource +
// Publisher): ACCEPTANCE context pack "Retry/DLQ: simulate svc-fail → 3 retry
// → task.assignment_failed publish + event gốc vào DLQ (test assert)".

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/segmentio/kafka-go"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

type fakeSource struct {
	mu     sync.Mutex
	msgs   []kafka.Message
	i      int
	fetchErr error // trả khi hết message (mô phỏng broker tạm lỗi)
	commits []kafka.Message
}

func (f *fakeSource) FetchMessage(context.Context) (kafka.Message, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.i < len(f.msgs) {
		m := f.msgs[f.i]
		f.i++
		return m, nil
	}
	return kafka.Message{}, f.fetchErr
}

func (f *fakeSource) CommitMessages(_ context.Context, msgs ...kafka.Message) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.commits = append(f.commits, msgs...)
	return nil
}

type fakePublisher struct {
	mu       sync.Mutex
	messages map[string][][]byte // topic → values
	failOn   map[string]bool     // topic → Publish trả error
}

func newFakePublisher() *fakePublisher {
	return &fakePublisher{messages: map[string][][]byte{}, failOn: map[string]bool{}}
}

func (f *fakePublisher) Publish(_ context.Context, topic string, _ []byte, value []byte) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.failOn[topic] {
		return errors.New("publish down (fake)")
	}
	f.messages[topic] = append(f.messages[topic], value)
	return nil
}

func (f *fakePublisher) topicValues(topic string) [][]byte {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([][]byte{}, f.messages[topic]...)
}

func newTestRunner(store *fakeEventStore, src *fakeSource, pub *fakePublisher) *Runner {
	return &Runner{
		Reader:       src,
		Handler:      newTestHandler(store),
		Publisher:    pub,
		Topic:        "task-events",
		DLQTopic:     "task-events.dlq",
		Log:          slog.Default(),
		RetryMaxN:    3,
		RetryBackoff: time.Millisecond, // test không chờ
	}
}

func assignedMsg(assignee string) kafka.Message {
	return kafka.Message{
		Key:   []byte("c7c7c7c7-7777-4777-8777-777777777777"),
		Value: []byte(`{"schemaVersion":1,"id":"3c4d5e6f-7081-4a92-b3c4-d5e6f708192a","type":"task.assigned","occurredAt":"2026-10-13T09:10:00Z","payload":{"taskId":"c7c7c7c7-7777-4777-8777-777777777777","userId":"11111111-1111-4111-8111-111111111111","assigneeId":"` + assignee + `"}}`),
	}
}

// TestRunner_SvcFailRetry3ThenCompensatingAndDLQ — ACCEPTANCE retry/DLQ.
func TestRunner_SvcFailRetry3ThenCompensatingAndDLQ(t *testing.T) {
	store := &fakeEventStore{}
	pub := newFakePublisher()
	src := &fakeSource{msgs: []kafka.Message{assignedMsg(FailUserID.String())}, fetchErr: context.Canceled}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go newTestRunner(store, src, pub).Run(ctx)

	// Poll đợi runner xử lý xong (fetch canceled → runner return).
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if len(pub.topicValues("task-events.dlq")) == 1 {
			break
		}
		time.Sleep(5 * time.Millisecond)
	}

	if rows := len(store.snapshot()); rows != 0 {
		t.Errorf("fail hook KHÔNG được ghi activity, got %d rows", rows)
	}

	comp := pub.topicValues("task-events")
	if len(comp) != 1 {
		t.Fatalf("compensating publish = %d, want 1 (retry ×3 hết → task.assignment_failed)", len(comp))
	}
	var env Envelope
	if err := json.Unmarshal(comp[0], &env); err != nil {
		t.Fatalf("compensating không đúng envelope: %v", err)
	}
	if env.Type != model.ActionTaskAssignmentFailed {
		t.Errorf("compensating type = %q", env.Type)
	}
	if env.ID.String() == "3c4d5e6f-7081-4a92-b3c4-d5e6f708192a" {
		t.Error("compensating id phải MỚI (go sinh), không phải id event gốc")
	}
	var p assignmentFailedPayload
	if err := json.Unmarshal(env.Payload, &p); err != nil {
		t.Fatalf("payload: %v", err)
	}
	if p.TaskID.String() != "c7c7c7c7-7777-4777-8777-777777777777" || p.AssigneeID != FailUserID {
		t.Errorf("compensating payload = %+v", p)
	}

	dlq := pub.topicValues("task-events.dlq")
	if len(dlq) != 1 {
		t.Fatalf("DLQ = %d, want 1 (event gốc sau retry ×3)", len(dlq))
	}
	var dm DLQMessage
	if err := json.Unmarshal(dlq[0], &dm); err != nil {
		t.Fatalf("DLQ không parse được: %v", err)
	}
	if dm.Error.Retries != 3 {
		t.Errorf("DLQ retries = %d, want 3", dm.Error.Retries)
	}
	var orig Envelope
	if err := json.Unmarshal([]byte(dm.OriginalEvent), &orig); err != nil {
		t.Fatalf("DLQ phải chứa event GỐC parse được: %v", err)
	}
	if orig.Type != model.ActionTaskAssigned {
		t.Errorf("DLQ original type = %q, want task.assigned", orig.Type)
	}

	// Message đã đưa DLQ thì commit offset (KHÔNG block partition).
	if len(src.committed()) != 1 {
		t.Errorf("commits = %d, want 1 (message không được kẹt partition)", len(src.committed()))
	}
}

// TestRunner_PoisonGoesStraightToDLQ — parse fail KHÔNG retry vô ích.
func TestRunner_PoisonGoesStraightToDLQ(t *testing.T) {
	store := &fakeEventStore{}
	pub := newFakePublisher()
	src := &fakeSource{msgs: []kafka.Message{
		{Key: []byte("k"), Value: []byte(`{not-envelope`)},
	}, fetchErr: context.Canceled}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go newTestRunner(store, src, pub).Run(ctx)

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if len(pub.topicValues("task-events.dlq")) == 1 {
			break
		}
		time.Sleep(5 * time.Millisecond)
	}

	if comp := pub.topicValues("task-events"); len(comp) != 0 {
		t.Errorf("poison KHÔNG được bắn compensating (không phải task.assigned fail), got %d", len(comp))
	}
	if dlq := pub.topicValues("task-events.dlq"); len(dlq) != 1 {
		t.Fatalf("DLQ = %d, want 1", len(dlq))
	} else {
		var dm DLQMessage
		if err := json.Unmarshal(dlq[0], &dm); err != nil {
			t.Fatalf("DLQ message không parse được (poison phải vẫn vào DLQ nguyên văn): %v — body: %s", err, dlq[0])
		}
		if dm.Error.Retries != 3 {
			t.Errorf("poison retries ghi nhận = %d, want 3 — body: %s", dm.Error.Retries, dlq[0])
		}
		if !strings.Contains(dm.Error.Reason, "poison") {
			t.Errorf("reason = %q, want chứa 'poison'", dm.Error.Reason)
		}
		// Message gốc KHÔNG hợp lệ JSON — vẫn phải nằm nguyên văn trong DLQ
		if !strings.Contains(dm.OriginalEvent, "not-envelope") {
			t.Errorf("originalEvent = %q, want nguyên văn poison bytes", dm.OriginalEvent)
		}
	}
}

// TestRunner_HappyPathNoDLQ — golden fixture bob (không svc-fail) → 1 row,
// KHÔNG compensating, KHÔNG DLQ, commit sau insert.
func TestRunner_HappyPathNoDLQ(t *testing.T) {
	store := &fakeEventStore{}
	pub := newFakePublisher()
	raw, err := loadFixtureBytes(t, "task.assigned.json")
	if err != nil {
		t.Fatalf("fixture: %v", err)
	}
	src := &fakeSource{msgs: []kafka.Message{{Key: []byte("k"), Value: raw}}, fetchErr: context.Canceled}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go newTestRunner(store, src, pub).Run(ctx)

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if len(store.snapshot()) == 1 {
			break
		}
		time.Sleep(5 * time.Millisecond)
	}

	if rows := store.snapshot(); len(rows) != 1 {
		t.Fatalf("rows = %d, want 1", len(rows))
	}
	if comp := pub.topicValues("task-events"); len(comp) != 0 {
		t.Errorf("happy path KHÔNG được publish gì, got %d", len(comp))
	}
	if dlq := pub.topicValues("task-events.dlq"); len(dlq) != 0 {
		t.Errorf("happy path KHÔNG được đưa DLQ, got %d", len(dlq))
	}
	if len(src.committed()) != 1 {
		t.Errorf("commit sau DB tx = %d, want 1 (manual commit rule)", len(src.committed()))
	}
}

// TestRunner_FilteredTypeStillCommits — assignment_failed skip → nil → commit
// (offset không kẹt trên message bị filter).
func TestRunner_FilteredTypeStillCommits(t *testing.T) {
	store := &fakeEventStore{}
	pub := newFakePublisher()
	raw, err := loadFixtureBytes(t, "task.assignment_failed.json")
	if err != nil {
		t.Fatalf("fixture: %v", err)
	}
	src := &fakeSource{msgs: []kafka.Message{{Key: []byte("k"), Value: raw}}, fetchErr: context.Canceled}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go newTestRunner(store, src, pub).Run(ctx)

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if len(src.committed()) == 1 {
			break
		}
		time.Sleep(5 * time.Millisecond)
	}
	if len(src.committed()) != 1 {
		t.Fatalf("commit = %d, want 1 (filter-by-type vẫn commit)", len(src.committed()))
	}
	if rows := store.snapshot(); len(rows) != 0 {
		t.Errorf("filtered type được ghi %d rows, want 0", len(rows))
	}
}

// TestRunner_DLQPublishFailSkipsCommit — P1 code-review SF-3: publish DLQ
// fail (broker down) → KHÔNG được commit offset — message gốc chỉ còn ở topic
// chính, commit = mất vĩnh viễn. Skip commit → redelivery sau restart
// (idempotency DB lo trùng); compensating (publish TRƯỚC DLQ) vẫn ra khỏi
// runner vì publish topic chính OK.
func TestRunner_DLQPublishFailSkipsCommit(t *testing.T) {
	store := &fakeEventStore{}
	pub := newFakePublisher()
	pub.failOn["task-events.dlq"] = true
	src := &fakeSource{msgs: []kafka.Message{assignedMsg(FailUserID.String())}, fetchErr: context.Canceled}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go newTestRunner(store, src, pub).Run(ctx)

	// Đợi tới khi compensating publish xong (bước ngay trước DLQ-fail).
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if len(pub.topicValues("task-events")) == 1 {
			break
		}
		time.Sleep(5 * time.Millisecond)
	}
	time.Sleep(50 * time.Millisecond) // grace — commit sai nếu có cũng kịp xảy ra

	if dlq := pub.topicValues("task-events.dlq"); len(dlq) != 0 {
		t.Errorf("DLQ = %d, want 0 (publish fail — KHÔNG được giả vờ đã đưa DLQ)", len(dlq))
	}
	if len(src.committed()) != 0 {
		t.Errorf("commits = %d, want 0 — commit khi DLQ publish fail = MẤT message vĩnh viễn", len(src.committed()))
	}
}

// TestRunner_CompensatingPublishFailSkipsCommit — publish compensating fail
// → toDLQ trả error TRƯỚC khi DLQ publish → skip commit (at-least-once cho
// cả compensating: redelivery → Handle fail lại (svc-fail deterministic) →
// thử compensating lần nữa).
func TestRunner_CompensatingPublishFailSkipsCommit(t *testing.T) {
	store := &fakeEventStore{}
	pub := newFakePublisher()
	pub.failOn["task-events"] = true
	src := &fakeSource{msgs: []kafka.Message{assignedMsg(FailUserID.String())}, fetchErr: context.Canceled}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go newTestRunner(store, src, pub).Run(ctx)

	time.Sleep(100 * time.Millisecond) // retry ×3 (backoff 1ms) + toDLQ fail — đủ xong

	if comp := pub.topicValues("task-events"); len(comp) != 0 {
		t.Errorf("task-events = %d, want 0 (publish luôn fail — fake không ghi)", len(comp))
	}
	if dlq := pub.topicValues("task-events.dlq"); len(dlq) != 0 {
		t.Errorf("DLQ = %d, want 0 — compensating fail phải chặn TRƯỚC DLQ (thứ tự: compensating rồi DLQ)", len(dlq))
	}
	if len(src.committed()) != 0 {
		t.Errorf("commits = %d, want 0 — compensating mất mà commit = task kẹt assigned mãi", len(src.committed()))
	}
}

// --- helpers ---

func (f *fakeEventStore) snapshot() []model.Event {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]model.Event{}, f.events...)
}

func (f *fakeSource) committed() []kafka.Message {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]kafka.Message{}, f.commits...)
}

func loadFixtureBytes(t *testing.T, name string) ([]byte, error) {
	return os.ReadFile(fixturesDir(t) + "/" + name)
}
