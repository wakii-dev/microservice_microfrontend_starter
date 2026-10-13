package config

import (
	"strings"
	"testing"
)

func TestLoad_OKWithRequiredEnv(t *testing.T) {
	cfg, err := Load(func(k string) string {
		env := map[string]string{
			"PORT":                  "9999",
			"DATABASE_URL":          "postgres://go_svc:pw@db:5432/app",
			"DATABASE_READONLY_URL": "postgres://go_readonly:pw@db:5432/app",
			"JWT_SECRET":            "secret-32-chars-minimum-ok",
			"CORS_DEV_ORIGIN":       "http://localhost:3000, http://localhost:4001",
		}
		return env[k]
	})
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
}

func TestLoad_MissingRequiredFailsFast(t *testing.T) {
	_, err := Load(func(k string) string { return "" })
	if err == nil {
		t.Fatal("expected error for missing required env")
	}
	for _, want := range []string{"DATABASE_URL", "DATABASE_READONLY_URL", "JWT_SECRET"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error %q does not mention %q", err.Error(), want)
		}
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
