// Package config load cấu hình go-svc 100% qua env-var (platform/conventions/06).
// Fail-fast khi thiếu env bắt buộc — không fallback im lặng cho secret.
package config

import (
	"fmt"
	"strings"
)

// Config là toàn bộ cấu hình runtime của go-svc.
type Config struct {
	Port                string
	DatabaseURL         string // owner connection — role go_svc (schema activity)
	DatabaseReadonlyURL string // readonly connection — role go_readonly (schema tasks)
	JWTSecret           string
	SpringSvcURL        string // resolve userName (conventions: spring sở hữu users)
	CORSDevOrigins      []string
	LogLevel            string
	// Kafka consumer (SF-3, conventions/09) — lazy-connect, KHÔNG vào readyz.
	KafkaBrokers  []string
	KafkaGroup    string // consumer group — filter-by-type (task-events.md)
	KafkaTopic    string
	KafkaDLQTopic string
	// Service-token (resolver enrich userName khi consume — không có HTTP caller).
	AuthMockURL          string
	SvcActivityPassword  string // secret — KHÔNG default (conventions/06)
}

// Load đọc env qua hàm getenv (inject được trong test).
func Load(getenv func(string) string) (*Config, error) {
	c := &Config{
		Port:                getenv("PORT"),
		DatabaseURL:         getenv("DATABASE_URL"),
		DatabaseReadonlyURL: getenv("DATABASE_READONLY_URL"),
		JWTSecret:           getenv("JWT_SECRET"),
		SpringSvcURL:        getenv("SPRING_SVC_URL"),
		LogLevel:            getenv("LOG_LEVEL"),
		KafkaBrokers:        parseBrokers(getenv("KAFKA_BROKERS")),
		KafkaGroup:          getenv("KAFKA_GROUP"),
		KafkaTopic:          getenv("KAFKA_TOPIC"),
		KafkaDLQTopic:       getenv("KAFKA_DLQ_TOPIC"),
		AuthMockURL:         getenv("AUTH_MOCK_URL"),
		SvcActivityPassword: getenv("SVC_ACTIVITY_PASSWORD"),
		CORSDevOrigins:      parseOrigins(getenv("CORS_DEV_ORIGIN")),
	}

	// Defaults theo conventions/05 — secret KHÔNG default (fail-fast).
	if c.Port == "" {
		c.Port = "8082"
	}
	if c.SpringSvcURL == "" {
		c.SpringSvcURL = "http://spring-svc:8081"
	}
	if c.LogLevel == "" {
		c.LogLevel = "info"
	}
	if c.KafkaGroup == "" {
		c.KafkaGroup = "go-svc-activity" // task-events.md consumer groups
	}
	if c.KafkaTopic == "" {
		c.KafkaTopic = "task-events"
	}
	if c.KafkaDLQTopic == "" {
		c.KafkaDLQTopic = "task-events.dlq"
	}
	if c.AuthMockURL == "" {
		c.AuthMockURL = "http://auth-mock:8090"
	}

	var missing []string
	for _, kv := range []struct {
		name string
		val  string
	}{
		{"DATABASE_URL", c.DatabaseURL},
		{"DATABASE_READONLY_URL", c.DatabaseReadonlyURL},
		{"JWT_SECRET", c.JWTSecret},
		{"KAFKA_BROKERS", getenv("KAFKA_BROKERS")},
		{"SVC_ACTIVITY_PASSWORD", c.SvcActivityPassword},
	} {
		if kv.val == "" {
			missing = append(missing, kv.name)
		}
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("missing required env vars: %s", strings.Join(missing, ", "))
	}
	return c, nil
}

// parseBrokers tách KAFKA_BROKERS theo dấu phẩy (compose truyền 1 broker).
func parseBrokers(raw string) []string {
	var out []string
	for _, s := range strings.Split(raw, ",") {
		if s = strings.TrimSpace(s); s != "" {
			out = append(out, s)
		}
	}
	return out
}

// parseOrigins tách CORS_DEV_ORIGIN theo dấu phẩy (conventions/07).
// Rỗng → nil = deny-by-default (prod profile không emit ACAO).
func parseOrigins(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	var out []string
	for _, s := range strings.Split(raw, ",") {
		if s = strings.TrimSpace(s); s != "" {
			out = append(out, s)
		}
	}
	return out
}
