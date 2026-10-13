package resolve

// token.go — service-token cho consumer path (story FI-76 SF-3).
// go consumer KHÔNG có HTTP request để passthrough Authorization như REST cũ —
// tự login fixture service user `svc-activity` (AUTH_MOCK_URL +
// SVC_ACTIVITY_PASSWORD) lấy JWT, cache, lazy re-login khi 401/expiry.
// Boot-time: retry backoff, KHÔNG crash nếu auth-mock chưa lên (go chỉ
// depends_on postgres — lazy-connect, conventions/09 rule 1).

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"
)

const (
	tokenLoginTimeout = 3 * time.Second
	// tokenCacheTTL — JWT auth-mock TTL 8h (token contract) nhưng cache ngắn
	// hơn chủ động: 30 phút đủ demo, hết hạn → login lại trong lần dùng kế.
	tokenCacheTTL = 30 * time.Minute
	// bootRetry cadence — auth-mock down lúc boot là trạng thái BÌNH THƯỜNG
	// (không service nào depends_on service nào qua kafka chain).
	bootRetryBackoff = 5 * time.Second
	bootRetryMax     = 12 // ~1 phút rồi từng bước theo CI poll; sau đó Token() lazy thử lại
)

// TokenSource login + cache service JWT (thread-safe).
type TokenSource struct {
	authURL  string // vd http://auth-mock:8090
	email    string // svc-activity@demo.local (fixture users.json)
	password string // SVC_ACTIVITY_PASSWORD — khớp AUTH_MOCK_DEV_PASSWORD
	client   *http.Client

	// warmup retry inject được trong test (default: bootRetryBackoff/Max)
	retryBackoff time.Duration
	retryMax     int

	mu     sync.Mutex
	token  string
	expire time.Time
}

// NewTokenSource tạo token source cho service user.
func NewTokenSource(authURL, email, password string) *TokenSource {
	return &TokenSource{
		authURL:      authURL,
		email:        email,
		password:     password,
		client:       &http.Client{Timeout: tokenLoginTimeout},
		retryBackoff: bootRetryBackoff,
		retryMax:     bootRetryMax,
	}
}

// Warmup login sớm lúc boot với retry backoff — chỉ LOG warn khi chưa được,
// KHÔNG trả error ra caller (consumer vẫn start; Token() lazy thử lại).
func (t *TokenSource) Warmup(ctx context.Context, log *slog.Logger) {
	for i := 1; i <= t.retryMax; i++ {
		if ctx.Err() != nil {
			return
		}
		if _, err := t.Token(ctx); err == nil {
			return
		}
		if log != nil {
			log.Warn("service-token warmup retry (auth-mock chưa lên?)", "attempt", i)
		}
		select {
		case <-ctx.Done():
			return
		case <-time.After(t.retryBackoff):
		}
	}
}

// Token trả JWT còn hạn; hết hạn/chưa có → login (lazy).
func (t *TokenSource) Token(ctx context.Context) (string, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.token != "" && time.Now().Before(t.expire) {
		return t.token, nil
	}
	tok, err := t.login(ctx)
	if err != nil {
		return "", err
	}
	t.token = tok
	t.expire = time.Now().Add(tokenCacheTTL)
	return t.token, nil
}

// Invalidate xoá cache — gọi khi resolver gặp 401 → lần dùng kế login lại.
func (t *TokenSource) Invalidate() {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.token = ""
	t.expire = time.Time{}
}

func (t *TokenSource) login(ctx context.Context) (string, error) {
	body, _ := json.Marshal(map[string]string{"email": t.email, "password": t.password})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, t.authURL+"/api/auth/login", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("build login request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := t.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("login auth-mock: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("login auth-mock = %d", res.StatusCode)
	}
	var out struct {
		AccessToken string `json:"accessToken"`
	}
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return "", fmt.Errorf("decode login response: %w", err)
	}
	if out.AccessToken == "" {
		return "", fmt.Errorf("login response thiếu accessToken")
	}
	return out.AccessToken, nil
}
