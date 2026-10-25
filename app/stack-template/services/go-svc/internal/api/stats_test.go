package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

// jsonUnmarshal helper cho test.
func jsonUnmarshal(b []byte, v interface{}) error {
	return json.NewDecoder(bytes.NewReader(b)).Decode(v)
}

func TestStats_OK(t *testing.T) {
	h := &StatsHandler{
		Store: &fakeStore{eventsLenForRecent: 2},
		Tasks: &fakeTasks{stats: model.TaskStats{
			TotalTasks: 7,
			ByStatus:   map[string]int{"todo": 3, "in_progress": 2, "done": 2},
		}},
		Log: slog.Default(),
	}
	req := httptest.NewRequest(http.MethodGet, "/api/activity/stats", nil)
	rec := httptest.NewRecorder()
	h.Get(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var resp statsResponse
	if err := jsonUnmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("bad json: %v", err)
	}
	if resp.TotalTasks != 7 {
		t.Errorf("totalTasks = %d, want 7", resp.TotalTasks)
	}
	for _, k := range []string{"todo", "in_progress", "done"} {
		if _, ok := resp.TasksByStatus[k]; !ok {
			t.Errorf("tasksByStatus thiếu key %q (contract: 3 giá trị CHECK constraint)", k)
		}
	}
	if resp.RecentEvents != 2 {
		t.Errorf("recentEvents = %d, want 2", resp.RecentEvents)
	}
}

func TestStats_TasksUnavailable503Envelope(t *testing.T) {
	// exit criterion negative path: không đọc được schema tasks → 503 DEPENDENCY_DOWN
	h := &StatsHandler{
		Store: &fakeStore{},
		Tasks: &fakeTasks{unavail: true},
		Log:   slog.Default(),
	}
	req := httptest.NewRequest(http.MethodGet, "/api/activity/stats", nil)
	req = req.WithContext(contextWithRequestID(req, "req-stats"))
	rec := httptest.NewRecorder()
	h.Get(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
	assertEnvelope(t, rec.Body.String(), CodeDependencyDown, "req-stats")
}

func TestStats_UnexpectedErrorIs500(t *testing.T) {
	h := &StatsHandler{
		Store: &fakeStore{},
		Tasks: &fakeTasks{err: errors.New("connection reset")},
		Log:   slog.Default(),
	}
	req := httptest.NewRequest(http.MethodGet, "/api/activity/stats", nil)
	rec := httptest.NewRecorder()
	h.Get(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500 (lỗi thật không map 503)", rec.Code)
	}
}
