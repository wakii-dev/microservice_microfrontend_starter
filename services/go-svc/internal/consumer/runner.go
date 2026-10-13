package consumer

// runner.go — vòng lặp consume: FetchMessage → Handle (retry ×3 in-memory)
// → hết lượt: compensating `task.assignment_failed` (chỉ cho task.assigned —
// saga semantics; DB down sai rét compensating = mark nhầm task) + DLQ message
// gốc → CommitMessages CUỐI CÙNG (manual commit SAU khi xử lý xong/đưa DLQ —
// conventions/09 rule 5: commit trước = crash mất event).

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

const (
	// RetryMax — in-memory ×3 (ADR-0008 simplification có chủ đích; production:
	// retry topic + backoff lâu).
	RetryMax = 3
	// RetryBackoff — backoff giữa các lần retry (demo: ngắn để e2e không chờ).
	RetryBackoff = 500 * time.Millisecond
)

// MessageSource — seam thay kafka.Reader trong unit test (FetchMessage +
// CommitMessages đúng shape segmentio).
type MessageSource interface {
	FetchMessage(ctx context.Context) (kafka.Message, error)
	CommitMessages(ctx context.Context, msgs ...kafka.Message) error
}

// Runner chạy consumer loop cho 1 group.
type Runner struct {
	Reader    MessageSource
	Handler   *Handler
	Publisher Publisher
	Topic     string // task-events — nơi publish compensating
	DLQTopic  string // task-events.dlq
	Log       *slog.Logger

	// inject được trong test (default: RetryMax / RetryBackoff)
	RetryMaxN    int
	RetryBackoff time.Duration
}

// NewReader dựng kafka.Reader thật (consumer group + earliest — task-events.md).
func NewReader(brokers []string, group, topic string) *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:     brokers,
		GroupID:     group,
		GroupTopics: []string{topic},
		// auto.offset.reset earliest — consumer mới đọc lại từ đầu (idempotency
		// lo duplicates — task-events.md delivery semantics).
		StartOffset: kafka.First,
		MinBytes:    1,
		MaxBytes:    1 << 20, // 1MB — envelope nhỏ, không cần lớn hơn
	})
}

// Run chạy tới khi ctx huỷ (graceful shutdown từ main). Không return error
// thường — log là đủ (consumer down ≠ service down, lazy-connect convention).
func (r *Runner) Run(ctx context.Context) {
	retryMax := r.RetryMaxN
	if retryMax <= 0 {
		retryMax = RetryMax
	}
	backoff := r.RetryBackoff
	if backoff <= 0 {
		backoff = RetryBackoff
	}

	for {
		msg, err := r.Reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil || errors.Is(err, context.Canceled) {
				r.Log.Info("consumer stopped", "reason", ctx.Err())
				return
			}
			// broker chưa lên / disconnect tạm — retry vòng kế (lazy-connect,
			// conventions/09 rule 1: KHÔNG crash, KHÔNG fallback im lặng).
			r.Log.Warn("fetch message failed — retry vòng kế", "err", err.Error())
			select {
			case <-ctx.Done():
				return
			case <-time.After(time.Second):
			}
			continue
		}

		procErr := r.processWithRetry(ctx, msg, retryMax, backoff)
		if procErr != nil {
			r.toDLQ(ctx, msg, procErr, retryMax)
		}

		// Manual commit SAU khi xử lý xong (DB insert đã commit) hoặc đã đưa
		// DLQ — at-least-once; idempotency (ON CONFLICT envelope id) lo redelivery.
		if err := r.Reader.CommitMessages(ctx, msg); err != nil {
			r.Log.Error("commit offset failed — message sẽ re-consume sau restart",
				"eventId", string(msg.Key), "err", err.Error())
		}
	}
}

// processWithRetry: parse → Handle retry ×3. Parse fail = poison → trả error
// ngay (retry vô ích — DLQ trực tiếp). Trả nil khi OK (kể cả filter-skip).
func (r *Runner) processWithRetry(ctx context.Context, msg kafka.Message, retryMax int, backoff time.Duration) error {
	env, err := ParseEnvelope(msg.Value)
	if err != nil {
		return &poisonError{reason: err.Error()}
	}

	var lastErr error
	for attempt := 1; attempt <= retryMax; attempt++ {
		if err := r.Handler.Handle(ctx, env); err == nil {
			return nil
		} else {
			lastErr = err
			r.Log.Warn("handle failed — retry",
				"eventId", env.ID.String(), "attempt", attempt, "err", err.Error())
		}
		select {
		case <-ctx.Done():
			return lastErr
		case <-time.After(backoff):
		}
	}
	return lastErr
}

// poisonError — envelope sai shape/schema: KHÔNG retry (đưa thẳng DLQ).
type poisonError struct{ reason string }

func (e *poisonError) Error() string { return "poison message: " + e.reason }

// toDLQ — saga fail: publish compensating (nếu nguồn là task.assigned) rồi
// đẩy message gốc + metadata vào DLQ. Lỗi publish chỉ LOG — KHÔNG block
// partition, KHÔNG crash (conventions/09 rule 7).
func (r *Runner) toDLQ(ctx context.Context, msg kafka.Message, procErr error, retryMax int) {
	reason := procErr.Error()

	// Compensating CHỈ cho task.assigned fail (saga choreography — node
	// compensation consumer UPDATE conditional). Poison/DB-down của type khác
	// KHÔNG được mark task assignment_failed.
	var env Envelope
	var poison *poisonError
	if !errors.As(procErr, &poison) {
		if e, err := ParseEnvelope(msg.Value); err == nil && e.Type == model.ActionTaskAssigned {
			env = e
		}
	}
	if env.ID != uuid.Nil {
		var p taskUserPayload
		if json.Unmarshal(env.Payload, &p) == nil && p.TaskID != uuid.Nil {
			comp := CompensatingEnvelope(p.TaskID, p.AssigneeID, reason, time.Now())
			if raw, err := comp.Marshal(); err == nil {
				if err := r.Publisher.Publish(ctx, r.Topic, msg.Key, raw); err != nil {
					r.Log.Error("publish compensating failed", "eventId", comp.ID.String(), "err", err.Error())
				} else {
					r.Log.Warn("compensating event published",
						"eventId", comp.ID.String(), "taskId", p.TaskID.String())
				}
			}
		}
	}

	dlq, _ := json.Marshal(NewDLQMessage(msg.Value, reason, retryMax, time.Now()))
	if err := r.Publisher.Publish(ctx, r.DLQTopic, msg.Key, dlq); err != nil {
		r.Log.Error("publish DLQ failed — message gốc sẽ re-consume", "err", err.Error())
	} else {
		r.Log.Warn("message gốc đưa DLQ", "reason", reason)
	}
}
