package api

import (
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

func seedEvents(t *testing.T, store *fakeStore, n int) {
	t.Helper()
	base := time.Date(2026, 10, 12, 5, 0, 0, 0, time.UTC)
	for i := 0; i < n; i++ {
		_ = store.InsertEvent(context.Background(), &model.Event{
			ID:        mustUUID("9f0e0000-0000-4000-8000-00000000000" + string(rune('a'+i%26))),
			TaskID:    mustUUID("9f0e0000-0000-4000-8000-000000000100"),
			UserID:    mustUUID("11111111-1111-4111-8111-111111111111"),
			Action:    "task.created",
			Timestamp: base.Add(time.Duration(i) * time.Minute),
			UserName:  "Alice",
			TaskTitle: "T",
		})
	}
}

func TestFeed_ListNewestFirstWithTotal(t *testing.T) {
	store := &fakeStore{}
	seedEvents(t, store, 5)
	h := &FeedHandler{Store: store, Resolver: fakeResolver{name: ""}, Tasks: &fakeTasks{}, Log: slog.Default()}

	req := httptest.NewRequest(http.MethodGet, "/api/activity/feed?limit=2&offset=0", nil)
	rec := httptest.NewRecorder()
	h.List(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var resp feedResponse
	if err := jsonUnmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("bad json: %v", err)
	}
	if resp.Total != 5 {
		t.Errorf("total = %d, want 5", resp.Total)
	}
	if len(resp.Items) != 2 {
		t.Fatalf("items = %d, want 2 (limit)", len(resp.Items))
	}
	// newest first: item[0].timestamp > item[1].timestamp
	t0, _ := time.Parse(time.RFC3339, resp.Items[0].Timestamp)
	t1, _ := time.Parse(time.RFC3339, resp.Items[1].Timestamp)
	if !t0.After(t1) {
		t.Errorf("feed not newest-first: %v then %v", t0, t1)
	}
	for _, it := range resp.Items {
		if it.UserName == "" || it.TaskTitle == "" {
			t.Errorf("feed item thiếu display fields (required): %+v", it)
		}
	}
}

func TestFeed_LimitClamped(t *testing.T) {
	store := &fakeStore{}
	seedEvents(t, store, 3)
	h := &FeedHandler{Store: store, Resolver: fakeResolver{name: ""}, Tasks: &fakeTasks{}, Log: slog.Default()}

	for _, q := range []string{"limit=999", "limit=-5", "limit=abc", ""} {
		url := "/api/activity/feed" + func() string {
			if q == "" {
				return ""
			}
			return "?" + q
		}()
		req := httptest.NewRequest(http.MethodGet, url, nil)
		rec := httptest.NewRecorder()
		h.List(rec, req)
		if rec.Code != http.StatusOK {
			t.Errorf("%q: status %d, want 200", q, rec.Code)
		}
		var resp feedResponse
		_ = jsonUnmarshal(rec.Body.Bytes(), &resp)
		if len(resp.Items) > 100 || len(resp.Items) == 0 {
			t.Errorf("%q: items = %d, nằm ngoài clamp 1..100", q, len(resp.Items))
		}
	}
}

func TestFeed_BackfillsMissingDisplayFields(t *testing.T) {
	store := &fakeStore{}
	// event ingested khi spring down → display fields rỗng trong DB
	_ = store.InsertEvent(context.Background(), &model.Event{
		ID:        mustUUID("9f0e0000-0000-4000-8000-0000000000aa"),
		TaskID:    mustUUID("9f0e0000-0000-4000-8000-000000000100"),
		UserID:    mustUUID("11111111-1111-4111-8111-111111111111"),
		Action:    "task.created",
		Timestamp: time.Now(),
	})
	h := &FeedHandler{
		Store:    store,
		Resolver: fakeResolver{name: "Alice Demo"}, // spring sống lại
		Tasks:    &fakeTasks{titles: map[uuid.UUID]string{mustUUID("9f0e0000-0000-4000-8000-000000000100"): "Title Backfilled"}},
		Log:      slog.Default(),
	}

	req := httptest.NewRequest(http.MethodGet, "/api/activity/feed", nil)
	rec := httptest.NewRecorder()
	h.List(rec, req)

	if !strings.Contains(rec.Body.String(), "Alice Demo") || !strings.Contains(rec.Body.String(), "Title Backfilled") {
		t.Errorf("feed không backfill display fields: %s", rec.Body.String())
	}
}
