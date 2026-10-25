package consumer

// producer.go — go-svc là PRODUCER lúc saga fail: publish compensating
// `task.assignment_failed` (envelope id MỚI do go sinh — go là producer của
// event này) vào task-events + đẩy message gốc vào task-events.dlq
// (task-events.md delivery semantics; conventions/09 rule 7).

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

// Publisher — seam test (fake trong unit test; KafkaPublisher thật trong main).
type Publisher interface {
	Publish(ctx context.Context, topic string, key []byte, value []byte) error
}

// KafkaPublisher — Writer per topic (cache), shared transport; message key =
// payload.taskId (task-events.md — thứ tự per-task trong partition).
type KafkaPublisher struct {
	brokers []string
	mu      sync.Mutex
	writers map[string]*kafka.Writer
}

// NewKafkaPublisher tạo publisher trỏ brokers (lazy-connect — Writer chỉ
// mở kết nối ở lần Publish đầu; broker chưa lên = trả error, không crash).
func NewKafkaPublisher(brokers ...string) *KafkaPublisher {
	return &KafkaPublisher{brokers: brokers, writers: map[string]*kafka.Writer{}}
}

func (p *KafkaPublisher) writer(topic string) *kafka.Writer {
	p.mu.Lock()
	defer p.mu.Unlock()
	if w, ok := p.writers[topic]; ok {
		return w
	}
	w := &kafka.Writer{
		Addr:         kafka.TCP(p.brokers...),
		Topic:        topic,
		Balancer:     &kafka.Hash{}, // key=taskId → cùng partition per-task
		RequiredAcks: kafka.RequireOne,
	}
	p.writers[topic] = w
	return w
}

func (p *KafkaPublisher) Publish(ctx context.Context, topic string, key, value []byte) error {
	if err := p.writer(topic).WriteMessages(ctx, kafka.Message{Key: key, Value: value}); err != nil {
		return fmt.Errorf("publish %s: %w", topic, err)
	}
	return nil
}

// Close đóng mọi writer (graceful shutdown).
func (p *KafkaPublisher) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()
	var firstErr error
	for _, w := range p.writers {
		if err := w.Close(); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

// CompensatingEnvelope — event `task.assignment_failed` với envelope id MỚI
// (go sinh — mỗi event 1 id, task-events.md).
func CompensatingEnvelope(taskID, assigneeID uuid.UUID, reason string, now time.Time) Envelope {
	payload, _ := json.Marshal(assignmentFailedPayload{
		TaskID:     taskID,
		AssigneeID: assigneeID,
		Reason:     reason,
	})
	return Envelope{
		SchemaVersion: SchemaVersion,
		ID:            uuid.New(),
		Type:          model.ActionTaskAssignmentFailed,
		OccurredAt:    now.UTC(),
		Payload:       payload,
	}
}

// DLQMessage — message gốc (raw) + metadata lỗi vào task-events.dlq
// (task-events.md: "Message GỐC + metadata lỗi"). KHÔNG requeue tự động.
// OriginalEvent là STRING nguyên văn (không phải RawMessage): poison message
// vốn KHÔNG phải JSON hợp lệ — RawMessage làm json.Marshal của wrapper fail
// im lặng → DLQ nhận bytes rỗng (bug đã bắt bằng unit test).
type DLQMessage struct {
	SchemaVersion int      `json:"schemaVersion"`
	OriginalEvent string   `json:"originalEvent"`
	Error         DLQError `json:"error"`
}

// DLQError — metadata lỗi đi kèm event gốc trong DLQ.
type DLQError struct {
	Reason   string    `json:"reason"`
	Retries  int       `json:"retries"`
	FailedAt time.Time `json:"failedAt"`
}

func NewDLQMessage(original []byte, reason string, retries int, now time.Time) DLQMessage {
	return DLQMessage{
		SchemaVersion: SchemaVersion,
		OriginalEvent: string(original),
		Error:         DLQError{Reason: reason, Retries: retries, FailedAt: now.UTC()},
	}
}
