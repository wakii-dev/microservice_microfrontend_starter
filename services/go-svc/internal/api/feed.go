package api

// feed.go — GET /api/activity/feed: feed mới nhất trước + total.
// User-display fields (userName, taskTitle) BẮT BUỘC trong item (activity.yaml
// ActivityFeedItem required) — FE render trực tiếp, không tự bịa placeholder.

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"time"
)

const (
	feedDefaultLimit = 20
	feedMaxLimit     = 100
)

// feedItem mirror ActivityFeedItem (all required).
type feedItem struct {
	ID        string `json:"id"`
	TaskID    string `json:"taskId"`
	UserID    string `json:"userId"`
	Action    string `json:"action"`
	Timestamp string `json:"timestamp"`
	UserName  string `json:"userName"`
	TaskTitle string `json:"taskTitle"`
}

type feedResponse struct {
	Items []feedItem `json:"items"`
	Total int        `json:"total"`
}

// FeedHandler deps cho GET /feed.
type FeedHandler struct {
	Store    EventStore
	Resolver DisplayResolver
	Tasks    TaskReader
	Log      *slog.Logger
}

// List xử lý GET /feed (mount sau JWTMiddleware).
func (h *FeedHandler) List(w http.ResponseWriter, r *http.Request) {
	limit := clampInt(r.URL.Query().Get("limit"), 1, feedMaxLimit, feedDefaultLimit)
	offset, err := strconv.Atoi(r.URL.Query().Get("offset"))
	if err != nil || offset < 0 {
		offset = 0
	}

	events, total, err := h.Store.ListEvents(r.Context(), limit, offset)
	if err != nil {
		h.Log.Error("list events failed", "requestId", RequestID(r.Context()), "err", err.Error())
		WriteError(w, r, http.StatusInternalServerError, CodeInternal, "failed to list events", nil)
		return
	}

	authz := r.Header.Get("Authorization")
	items := make([]feedItem, 0, len(events))
	for _, ev := range events {
		item := feedItem{
			ID:        ev.ID.String(),
			TaskID:    ev.TaskID.String(),
			UserID:    ev.UserID.String(),
			Action:    ev.Action,
			Timestamp: ev.Timestamp.Format(time.RFC3339),
			UserName:  ev.UserName,
			TaskTitle: ev.TaskTitle,
		}
		// Display fields thiếu lúc ingest (spring/tasks down) → thử resolve lại lúc đọc.
		if item.UserName == "" {
			item.UserName = h.Resolver.UserName(r.Context(), authz, ev.UserID)
		}
		if item.TaskTitle == "" {
			if title, err := h.Tasks.TaskTitle(r.Context(), ev.TaskID); err == nil {
				item.TaskTitle = title
			}
		}
		items = append(items, item)
	}

	writeJSON(w, http.StatusOK, feedResponse{Items: items, Total: total})
}

// clampInt parse query int với min/max + default.
func clampInt(raw string, min, max, def int) int {
	n, err := strconv.Atoi(raw)
	if err != nil {
		return def
	}
	if n < min {
		return min
	}
	if n > max {
		return max
	}
	return n
}
