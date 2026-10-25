package config

import (
	"strings"
	"testing"
)

// baseEnv — env tối thiểu cho Load thành công (SF-3 thêm KAFKA_BROKERS +
// SVC_ACTIVITY_PASSWORD required).
func baseEnv() map[string]string {
	return map[string]string{
		"PORT":                  "9999",
		"DATABASE_URL":          "postgres://go_svc:pw@db:5432/app",
		"DATABASE_READONLY_URL": "postgres://go_readonly:pw@db:5432/app",
		"JWT_SECRET":            "secret-32-chars-minimum-ok",
		"KAFKA_BROKERS":         "kafka:9092",
		"SVC_ACTIVITY_PASSWORD": "demo-password",
		"CORS_DEV_ORIGIN":       "http://localhost:3000, http://localhost:4001",
	}
}

func TestLoad_OKWithRequiredEnv(t *testing.T) {
	env := baseEnv()
	cfg, err := Load(func(k string) string { return env[k] })
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if cfg.Port != "9999" {
		t.Errorf("Port = %q, want 9999", cfg.Port)
	}
	want := []string{"http://localhost:3000", "http://localhost:4001"}
	if len(cfg.CORSDevOrigins) != 2 || cfg.CORSDevOrigins[0] != want[0] || cfg.CORSDevOrigins[1] != want[1] {
		t.Errorf("CORSDevOrigins = %v, want %v", cfg.CORSDevOrigins, want)
	}
	// Kafka defaults — group/topic/DLQ theo task-events.md, không cần env
	if cfg.KafkaGroup != "go-svc-activity" || cfg.KafkaTopic != "task-events" || cfg.KafkaDLQTopic != "task-events.dlq" {
		t.Errorf("kafka defaults = %q/%q/%q, want go-svc-activity/task-events/task-events.dlq",
			cfg.KafkaGroup, cfg.KafkaTopic, cfg.KafkaDLQTopic)
	}
	if len(cfg.KafkaBrokers) != 1 || cfg.KafkaBrokers[0] != "kafka:9092" {
		t.Errorf("KafkaBrokers = %v, want [kafka:9092]", cfg.KafkaBrokers)
	}
}

func TestLoad_MissingRequiredFailsFast(t *testing.T) {
	_, err := Load(func(k string) string { return "" })
	if err == nil {
		t.Fatal("expected error for missing required env")
	}
	for _, want := range []string{"DATABASE_URL", "DATABASE_READONLY_URL", "JWT_SECRET", "KAFKA_BROKERS", "SVC_ACTIVITY_PASSWORD"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error %q does not mention %q", err.Error(), want)
		}
	}
}

func TestLoad_MissingKafkaOnlyListsKafkaAndSecret(t *testing.T) {
	env := map[string]string{
		"DATABASE_URL":          "postgres://go_svc:pw@db:5432/app",
		"DATABASE_READONLY_URL": "postgres://go_readonly:pw@db:5432/app",
		"JWT_SECRET":            "secret-32-chars-minimum-ok",
	}
	_, err := Load(func(k string) string { return env[k] })
	if err == nil {
		t.Fatal("expected error khi thiếu KAFKA_BROKERS + SVC_ACTIVITY_PASSWORD")
	}
	if !strings.Contains(err.Error(), "KAFKA_BROKERS") || !strings.Contains(err.Error(), "SVC_ACTIVITY_PASSWORD") {
		t.Errorf("error = %q, want nêu cả 2 env thiếu", err.Error())
	}
	if strings.Contains(err.Error(), "JWT_SECRET") {
		t.Errorf("error = %q — JWT_SECRET đã cấp, không được liệt kê", err.Error())
	}
}

func TestParseOrigins_EmptyDeniesByDefault(t *testing.T) {
	if got := parseOrigins(""); got != nil {
		t.Errorf("parseOrigins(\"\") = %v, want nil (deny-by-default)", got)
	}
	if got := parseOrigins(" , ,"); got != nil {
		t.Errorf("parseOrigins(blank commas) = %v, want nil", got)
	}
}

func TestParseBrokers_MultiAndTrim(t *testing.T) {
	got := parseBrokers(" b1:9092 , b2:9092,")
	if len(got) != 2 || got[0] != "b1:9092" || got[1] != "b2:9092" {
		t.Errorf("parseBrokers = %v, want [b1:9092 b2:9092]", got)
	}
	if parseBrokers("") != nil {
		t.Errorf("parseBrokers(\"\") = want nil")
	}
}
