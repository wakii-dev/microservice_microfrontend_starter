package api

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequestIDMiddleware_EchoesAndGenerates(t *testing.T) {
	// Có X-Request-Id → echo lại
	var gotID string
	h := RequestIDMiddleware()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotID = RequestID(r.Context())
	}))
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Request-Id", "gw-abc")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if gotID != "gw-abc" {
		t.Errorf("context requestId = %q, want gw-abc", gotID)
	}
	if rec.Header().Get("X-Request-Id") != "gw-abc" {
		t.Errorf("response X-Request-Id = %q, want gw-abc", rec.Header().Get("X-Request-Id"))
	}

	// Thiếu header → sinh uuid mới
	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec2.Header().Get("X-Request-Id") == "" {
		t.Error("expected generated X-Request-Id when header missing")
	}
}

func TestRecoverMiddleware_PanicBecomes500Envelope(t *testing.T) {
	log := slog.Default()
	h := RecoverMiddleware(log)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("boom")
	}))
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req = req.WithContext(contextWithRequestID(req, "req-panic"))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
	assertEnvelope(t, rec.Body.String(), CodeInternal, "req-panic")
}
