package api

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthz_OK(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	Healthz(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := rec.Body.String(); got != "{\"status\":\"ok\"}\n" {
		t.Errorf("body = %q, want {\"status\":\"ok\"}", got)
	}
}

func TestReadyz_CheckerFails503Envelope(t *testing.T) {
	h := Readyz(readinessFunc(func() error { return errors.New("migration not applied") }))
	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	req = req.WithContext(contextWithRequestID(req, "req-1"))
	rec := httptest.NewRecorder()
	h(rec, req)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
	assertEnvelope(t, rec.Body.String(), "DEPENDENCY_DOWN", "req-1")
}

func TestReadyz_CheckerOK200(t *testing.T) {
	h := Readyz(readinessFunc(func() error { return nil }))
	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()
	h(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
}

type readinessFunc func() error

func (f readinessFunc) Ready() error { return f() }
