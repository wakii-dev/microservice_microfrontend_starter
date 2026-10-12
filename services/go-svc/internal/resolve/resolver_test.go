package resolve

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestUserName_ResolvesFromSpring(t *testing.T) {
	var gotAuth atomic.Value
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth.Store(r.Header.Get("Authorization"))
		if r.URL.Path != "/api/users/11111111-1111-4111-8111-111111111111" {
			t.Errorf("path = %q", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"id":"11111111-1111-4111-8111-111111111111","email":"alice@demo.local","displayName":"Alice Demo","roles":["admin"]}`))
	}))
	defer srv.Close()

	r := New(srv.URL)
	uid := uuid.MustParse("11111111-1111-4111-8111-111111111111")
	if got := r.UserName(context.Background(), "Bearer tok", uid); got != "Alice Demo" {
		t.Errorf("UserName = %q, want Alice Demo", got)
	}
	if got, _ := gotAuth.Load().(string); got != "Bearer tok" {
		t.Errorf("Authorization passthrough = %q, want Bearer tok", got)
	}
}

func TestUserName_CachesAfterFirstFetch(t *testing.T) {
	var calls atomic.Int64
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls.Add(1)
		_, _ = w.Write([]byte(`{"displayName":"Bob Demo"}`))
	}))
	defer srv.Close()

	r := New(srv.URL)
	uid := uuid.New()
	_ = r.UserName(context.Background(), "", uid)
	_ = r.UserName(context.Background(), "", uid)
	_ = r.UserName(context.Background(), "", uid)
	if calls.Load() != 1 {
		t.Errorf("spring called %d times, want 1 (cache TTL)", calls.Load())
	}
}

func TestUserName_SpringDownReturnsEmpty(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer srv.Close()

	r := New(srv.URL)
	if got := r.UserName(context.Background(), "", uuid.New()); got != "" {
		t.Errorf("UserName = %q, want \"\" (degraded, không bịa)", got)
	}
}

func TestUserName_TimeoutReturnsEmpty(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		time.Sleep(3 * time.Second) // > springTimeout 2s
		_, _ = w.Write([]byte(`{"displayName":"Slow"}`))
	}))
	defer srv.Close()

	r := New(srv.URL)
	start := time.Now()
	got := r.UserName(context.Background(), "", uuid.New())
	if got != "" {
		t.Errorf("UserName = %q, want \"\"", got)
	}
	if elapsed := time.Since(start); elapsed > 3*time.Second {
		t.Errorf("resolve took %v — timeout 2s không hiệu lực", elapsed)
	}
}
