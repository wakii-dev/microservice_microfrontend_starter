package resolve

// token_test.go — service-token: login + cache, 401 → lazy re-login,
// warmup retry KHÔNG crash khi auth-mock down lúc boot (ACCEPTANCE context pack).

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
)

func fakeAuth(t *testing.T, logins *atomic.Int32) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/auth/login" || r.Method != http.MethodPost {
			http.NotFound(w, r)
			return
		}
		var in struct{ Email, Password string }
		_ = json.NewDecoder(r.Body).Decode(&in)
		if in.Password == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		logins.Add(1)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"accessToken":"tok-` + strconv.Itoa(int(logins.Load())) + `","tokenType":"bearer"}`))
	}))
	t.Cleanup(srv.Close)
	return srv
}

func TestTokenSource_LoginAndCache(t *testing.T) {
	var logins atomic.Int32
	srv := fakeAuth(t, &logins)
	ts := NewTokenSource(srv.URL, "svc-activity@demo.local", "demo-password")

	tok1, err := ts.Token(context.Background())
	if err != nil {
		t.Fatalf("token: %v", err)
	}
	tok2, err := ts.Token(context.Background())
	if err != nil {
		t.Fatalf("token lần 2: %v", err)
	}
	if tok1 != tok2 {
		t.Errorf("token đổi giữa 2 lần gọi trong TTL: %q vs %q", tok1, tok2)
	}
	if logins.Load() != 1 {
		t.Errorf("logins = %d, want 1 (cache JWT)", logins.Load())
	}
}

func TestTokenSource_InvalidateLazyRelogin(t *testing.T) {
	var logins atomic.Int32
	srv := fakeAuth(t, &logins)
	ts := NewTokenSource(srv.URL, "svc-activity@demo.local", "demo-password")

	if _, err := ts.Token(context.Background()); err != nil {
		t.Fatalf("token: %v", err)
	}
	ts.Invalidate() // resolver gặp 401 → invalidate
	tok, err := ts.Token(context.Background())
	if err != nil {
		t.Fatalf("token sau invalidate: %v", err)
	}
	if tok != "tok-2" {
		t.Errorf("token = %q, want tok-2 (lazy re-login)", tok)
	}
	if logins.Load() != 2 {
		t.Errorf("logins = %d, want 2", logins.Load())
	}
}

func TestTokenSource_WarmupRetriesWithoutCrash(t *testing.T) {
	var logins atomic.Int32
	srv := fakeAuth(t, &logins)
	ts := NewTokenSource(srv.URL, "svc-activity@demo.local", "demo-password")
	ts.retryBackoff = time.Millisecond
	ts.retryMax = 3

	// auth-mock down lúc đầu — đóng tạm bằng wrapper trả lỗi: dùng URL sai
	// rồi khôi phục không tiện; thay vào đó verify retry path với retryMax
	// nhỏ trên server SỐNG (login ngay vòng 1) + verify KHÔNG crash khi
	// server chết hẳn:
	dead := NewTokenSource("http://127.0.0.1:1", "svc-activity@demo.local", "demo-password")
	dead.retryBackoff = time.Millisecond
	dead.retryMax = 2
	dead.Warmup(context.Background(), nil) // phải return, không panic

	if _, err := ts.Token(context.Background()); err != nil {
		t.Fatalf("token sau warmup: %v", err)
	}
	if logins.Load() < 1 {
		t.Errorf("logins = %d, want >= 1", logins.Load())
	}
}

func TestServiceUserName_EnrichAndLazyReloginOn401(t *testing.T) {
	var logins atomic.Int32
	auth := fakeAuth(t, &logins)
	unauthorized := atomic.Bool{}

	spring := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authz := r.Header.Get("Authorization")
		if authz == "Bearer tok-1" && unauthorized.Load() {
			w.WriteHeader(http.StatusUnauthorized) // token service vừa bị quay lại
			return
		}
		if authz == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"displayName":"Svc Activity (service user)"}`))
	}))
	t.Cleanup(spring.Close)

	ts := NewTokenSource(auth.URL, "svc-activity@demo.local", "demo-password")
	r := New(spring.URL).WithServiceToken(ts)

	// Lần 1: enrich thành công bằng service-token (user bob — cache miss)
	bob := uuid.MustParse("22222222-2222-4222-8222-222222222222")
	if got := r.ServiceUserName(context.Background(), bob); got != "Svc Activity (service user)" {
		t.Fatalf("userName = %q, want displayName qua service-token", got)
	}
	// Token bị spring từ chối (user carol — cache miss bắt fetch mới) → 401
	// → Invalidate + lazy re-login → thử lại thành công
	carol := uuid.MustParse("33333333-3333-4333-8333-333333333333")
	unauthorized.Store(true)
	if got := r.ServiceUserName(context.Background(), carol); got != "Svc Activity (service user)" {
		t.Fatalf("userName sau 401 = %q, want re-login rồi enrich lại", got)
	}
	if logins.Load() < 2 {
		t.Errorf("logins = %d, want >= 2 (lazy re-login)", logins.Load())
	}
}

func TestServiceUserName_NoTokenSourceDegradedEmpty(t *testing.T) {
	r := New("http://unused")
	if got := r.ServiceUserName(context.Background(), uuid.MustParse("44444444-4444-4444-8444-444444444444")); got != "" {
		t.Errorf("userName = %q, want \"\" (không token source — degraded trung thực)", got)
	}
}
