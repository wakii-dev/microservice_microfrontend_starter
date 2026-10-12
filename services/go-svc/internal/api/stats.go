package api

// stats.go — GET /api/activity/stats: thống kê schema tasks (readonly theo
// canonical DDL) + recentEvents 24h (schema activity). tasks không đọc được
// (permission/missing) → 503 DEPENDENCY_DOWN envelope — chứng minh permission
// boundary (exit criterion context pack).

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/apperr"
)

// statsResponse mirror ActivityStats (activity.yaml).
type statsResponse struct {
	TotalTasks    int            `json:"totalTasks"`
	TasksByStatus map[string]int `json:"tasksByStatus"`
	RecentEvents  int            `json:"recentEvents"`
}

// StatsHandler deps cho GET /stats.
type StatsHandler struct {
	Store EventStore
	Tasks TaskReader
	Log   *slog.Logger
}

// Get xử lý GET /stats (mount sau JWTMiddleware).
func (h *StatsHandler) Get(w http.ResponseWriter, r *http.Request) {
	ts, err := h.Tasks.Stats(r.Context())
	if err != nil {
		if errors.Is(err, apperr.ErrTasksUnavailable) {
			// Permission boundary thể hiện đúng contract: 503 + DEPENDENCY_DOWN.
			WriteError(w, r, http.StatusServiceUnavailable, CodeDependencyDown,
				"cannot read schema tasks (readonly permission or not migrated)", nil)
			return
		}
		h.Log.Error("stats query failed", "requestId", RequestID(r.Context()), "err", err.Error())
		WriteError(w, r, http.StatusInternalServerError, CodeInternal, "stats query failed", nil)
		return
	}

	recent, err := h.Store.CountRecent24h(r.Context())
	if err != nil {
		h.Log.Error("count recent events failed", "requestId", RequestID(r.Context()), "err", err.Error())
		WriteError(w, r, http.StatusInternalServerError, CodeInternal, "recent events query failed", nil)
		return
	}

	// 3 giá trị khớp CHECK constraint canonical DDL — luôn đủ key.
	byStatus := map[string]int{"todo": 0, "in_progress": 0, "done": 0}
	for k, v := range ts.ByStatus {
		byStatus[k] = v
	}
	writeJSON(w, http.StatusOK, statsResponse{
		TotalTasks:    ts.TotalTasks,
		TasksByStatus: byStatus,
		RecentEvents:  recent,
	})
}
