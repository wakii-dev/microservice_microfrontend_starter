package consumer

// ensure.go — đảm bảo topics tồn tại TRƯỚC khi consumer join group. Fix gốc
// race auto-create: join group TRƯỚC khi topic tồn tại → generation assignment
// RỖNG vĩnh viễn (kafka-go không re-subscribe khi topic xuất hiện sau — member
// đứng Stable với 0 partition, FetchMessage block câm; repro test C + report
// worker-kafka 2026-10-25). Idempotent: TopicAlreadyExists coi như thành công.
// Conventions/09: caller (main.go) KHÔNG fatal khi lỗi — log warn + consumer
// vẫn chạy (lazy-connect; EnsureTopics chỉ TĂNG xác suất assign ngay, không
// phải điều kiện sống còn).

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
)

// createTopicsFn — seam thay kafka.Client.CreateTopics trong unit test
// (không cần broker thật).
type createTopicsFn func(ctx context.Context, req *kafka.CreateTopicsRequest) (*kafka.CreateTopicsResponse, error)

// EnsureTopics tạo các topic (1 partition, RF 1 — demo single-node KRaft) nếu
// chưa tồn tại. Timeout 5s chặn trường hợp broker treo — caller không được phép
// chết vì lỗi này nên trễ tối đa 5s lúc boot là chấp nhận được.
func EnsureTopics(ctx context.Context, brokers []string, topics ...string) error {
	return ensureTopicsWith(ctx, func(ctx context.Context, req *kafka.CreateTopicsRequest) (*kafka.CreateTopicsResponse, error) {
		cl := &kafka.Client{Addr: kafka.TCP(brokers...), Timeout: 5 * time.Second}
		return cl.CreateTopics(ctx, req)
	}, topics...)
}

// ensureTopicsWith — core testable: gửi 1 CreateTopicsRequest cho tất cả topics,
// lọc per-topic TopicAlreadyExists (đã tồn tại = OK), gom lỗi thật còn lại.
func ensureTopicsWith(ctx context.Context, create createTopicsFn, topics ...string) error {
	if len(topics) == 0 {
		return nil
	}
	cfgs := make([]kafka.TopicConfig, 0, len(topics))
	for _, t := range topics {
		cfgs = append(cfgs, kafka.TopicConfig{Topic: t, NumPartitions: 1, ReplicationFactor: 1})
	}
	resp, err := create(ctx, &kafka.CreateTopicsRequest{Topics: cfgs})
	if err != nil {
		return fmt.Errorf("create topics %v: %w", topics, err)
	}
	var realErrs []error
	for _, topic := range topics {
		tErr, ok := resp.Errors[topic]
		if !ok {
			// Broker phải trả kết quả cho MỖI topic gửi đi — thiếu = bất thường
			realErrs = append(realErrs, fmt.Errorf("topic %s: không có kết quả từ broker", topic))
			continue
		}
		if tErr == nil || errors.Is(tErr, kafka.TopicAlreadyExists) {
			continue // tạo mới OK / đã tồn tại — cả hai đều thành công
		}
		realErrs = append(realErrs, fmt.Errorf("topic %s: %w", topic, tErr))
	}
	return errors.Join(realErrs...)
}
