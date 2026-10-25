package consumer

// ensure_test.go — unit test EnsureTopics qua seam createTopicsFn (không broker):
// parse per-topic TopicAlreadyExists (idempotent), gom lỗi thật, guard thiếu kết
// quả broker, đúng request shape (topics + partitions + RF).

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/segmentio/kafka-go"
)

func TestEnsureTopicsWith(t *testing.T) {
	ctx := context.Background()

	t.Run("topic tạo mới — nil error, request đúng shape", func(t *testing.T) {
		var gotReq *kafka.CreateTopicsRequest
		create := func(_ context.Context, req *kafka.CreateTopicsRequest) (*kafka.CreateTopicsResponse, error) {
			gotReq = req
			return &kafka.CreateTopicsResponse{Errors: map[string]error{
				"task-events":    nil,
				"task-events.dlq": nil,
			}}, nil
		}
		if err := ensureTopicsWith(ctx, create, "task-events", "task-events.dlq"); err != nil {
			t.Fatalf("ensureTopicsWith() = %v, want nil", err)
		}
		if gotReq == nil || len(gotReq.Topics) != 2 {
			t.Fatalf("request topics = %v, want 2 topics", gotReq)
		}
		for _, tc := range gotReq.Topics {
			if tc.NumPartitions != 1 || tc.ReplicationFactor != 1 {
				t.Fatalf("topic %s: partitions=%d rf=%d, want 1/1", tc.Topic, tc.NumPartitions, tc.ReplicationFactor)
			}
		}
	})

	t.Run("topic đã tồn tại (TopicAlreadyExists) — idempotent, nil error", func(t *testing.T) {
		create := func(_ context.Context, _ *kafka.CreateTopicsRequest) (*kafka.CreateTopicsResponse, error) {
			return &kafka.CreateTopicsResponse{Errors: map[string]error{
				"task-events":     kafka.TopicAlreadyExists,
				"task-events.dlq": kafka.TopicAlreadyExists,
			}}, nil
		}
		if err := ensureTopicsWith(ctx, create, "task-events", "task-events.dlq"); err != nil {
			t.Fatalf("TopicAlreadyExists phải coi như thành công, got %v", err)
		}
	})

	t.Run("một topic lỗi thật — error gom đúng topic", func(t *testing.T) {
		create := func(_ context.Context, _ *kafka.CreateTopicsRequest) (*kafka.CreateTopicsResponse, error) {
			return &kafka.CreateTopicsResponse{Errors: map[string]error{
				"task-events":     nil,
				"task-events.dlq": kafka.InvalidReplicationFactor,
			}}, nil
		}
		err := ensureTopicsWith(ctx, create, "task-events", "task-events.dlq")
		if err == nil {
			t.Fatal("want error khi topic lỗi thật")
		}
		if !strings.Contains(err.Error(), "task-events.dlq") {
			t.Fatalf("error phải nhắc topic lỗi, got %v", err)
		}
	})

	t.Run("broker unreachable (create trả error) — wrap error", func(t *testing.T) {
		create := func(_ context.Context, _ *kafka.CreateTopicsRequest) (*kafka.CreateTopicsResponse, error) {
			return nil, errors.New("dial tcp: connection refused")
		}
		err := ensureTopicsWith(ctx, create, "task-events")
		if err == nil || !strings.Contains(err.Error(), "connection refused") {
			t.Fatalf("want wrapped dial error, got %v", err)
		}
	})

	t.Run("broker thiếu kết quả cho topic — error (bất thường)", func(t *testing.T) {
		create := func(_ context.Context, _ *kafka.CreateTopicsRequest) (*kafka.CreateTopicsResponse, error) {
			return &kafka.CreateTopicsResponse{Errors: map[string]error{}}, nil
		}
		err := ensureTopicsWith(ctx, create, "task-events")
		if err == nil || !strings.Contains(err.Error(), "không có kết quả") {
			t.Fatalf("want missing-result error, got %v", err)
		}
	})

	t.Run("topics rỗng — no-op nil", func(t *testing.T) {
		called := false
		create := func(_ context.Context, _ *kafka.CreateTopicsRequest) (*kafka.CreateTopicsResponse, error) {
			called = true
			return &kafka.CreateTopicsResponse{}, nil
		}
		if err := ensureTopicsWith(ctx, create); err != nil {
			t.Fatalf("no-op = %v, want nil", err)
		}
		if called {
			t.Fatal("topics rỗng không được gọi broker")
		}
	})
}
