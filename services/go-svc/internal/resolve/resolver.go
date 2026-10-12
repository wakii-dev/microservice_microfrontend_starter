// Package resolve — resolve userName qua spring-svc REST (GET /api/users/{id}).
// Nguồn sự thật: platform/postgres/init/01-init.sh — go_readonly CHỈ được schema
// tasks, userName KHÔNG đọc từ DB users mà qua spring (contract activity.yaml).
// Best-effort + cache TTL; spring down → "" (degraded trung thực, không bịa).
package resolve

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
)

const (
	springTimeout = 2 * time.Second // ngang timeout node→spring (epic spec)
	cacheTTL      = 5 * time.Minute
)

type cacheEntry struct {
	name    string
	expires time.Time
}

// Resolver resolve display name user với in-memory cache.
type Resolver struct {
	springURL string
	client    *http.Client
	mu        sync.RWMutex
	cache     map[uuid.UUID]cacheEntry
}

// New tạo resolver trỏ SPRING_SVC_URL.
func New(springURL string) *Resolver {
	return &Resolver{
		springURL: springURL,
		client:    &http.Client{Timeout: springTimeout},
		cache:     make(map[uuid.UUID]cacheEntry),
	}
}

// UserName trả display name (cache → spring REST → ""). authorization là
// Bearer token của caller — passthrough vì spring tự verify JWT.
func (r *Resolver) UserName(ctx context.Context, authorization string, userID uuid.UUID) string {
	r.mu.RLock()
	if e, ok := r.cache[userID]; ok && time.Now().Before(e.expires) {
		r.mu.RUnlock()
		return e.name
	}
	r.mu.RUnlock()

	name := r.fetch(ctx, authorization, userID)

	r.mu.Lock()
	r.cache[userID] = cacheEntry{name: name, expires: time.Now().Add(cacheTTL)}
	r.mu.Unlock()
	return name
}

func (r *Resolver) fetch(ctx context.Context, authorization string, userID uuid.UUID) string {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		r.springURL+"/api/users/"+userID.String(), nil)
	if err != nil {
		return ""
	}
	if authorization != "" {
		req.Header.Set("Authorization", authorization)
	}
	res, err := r.client.Do(req)
	if err != nil {
		return ""
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return ""
	}
	var body struct {
		DisplayName string `json:"displayName"` // users.yaml User schema (required)
	}
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return ""
	}
	return body.DisplayName
}
