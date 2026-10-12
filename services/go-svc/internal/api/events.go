package api

// events.go — POST /api/activity/events: nhận push fire-and-forget từ node-svc
// (contract activity.yaml ActivityEventInput). Validate → resolve display fields
// best-effort → persist → 202 {"accepted":true}. KHÔNG chặn mutation bên node.

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/apperr"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

// allowedActions — enum nguồn sự thật (activity.yaml ActivityEventInput.action).
var allowedActions = map[string]bool{
	"task.created": true,
	"task.updated": true,
	"task.deleted": true,
}

// eventInput mirror ActivityEventInput (required: taskId, userId, action, timestamp).
type eventInput struct {
	TaskID    string `json:"taskId"`
	UserID    string `json:"userId"`
	Action    string `json:"action"`
	Timestamp string `json:"timestamp"`
}

// EventsHandler deps cho POST /events.
type EventsHandler struct {
	Store    EventStore
	Resolver DisplayResolver
	Tasks    TaskReader
	Log      *slog.Logger
}

// Ingest xử lý POST /events (mount sau JWTMiddleware — token đã verify).
func (h *EventsHandler) Ingest(w http.ResponseWriter, r *http.Request) {
	var in eventInput
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&in); err != nil {
		WriteError(w, r, http.StatusBadRequest, CodeValidationError, "body must be valid JSON", nil)
		return
	}

	taskID, err := uuid.Parse(in.TaskID)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, CodeValidationError, "taskId must be a uuid", map[string]string{"field": "taskId"})
		return
	}
	userID, err := uuid.Parse(in.UserID)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, CodeValidationError, "userId must be a uuid", map[string]string{"field": "userId"})
		return
	}
	if !allowedActions[in.Action] {
		WriteError(w, r, http.StatusBadRequest, CodeValidationError,
			"action must be one of task.created|task.updated|task.deleted", map[string]string{"field": "action"})
		return
	}
	ts, err := time.Parse(time.RFC3339, in.Timestamp)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, CodeValidationError, "timestamp must be RFC3339 (ISO 8601 UTC)", map[string]string{"field": "timestamp"})
		return
	}

	ev := &model.Event{
		ID:        uuid.New(), // id do app sinh — cùng quyết định canonical DDL tasks
		TaskID:    taskID,
		UserID:    userID,
		Action:    in.Action,
		Timestamp: ts.UTC(),
	}
	// Display fields resolve best-effort lúc ingest — spring/taskTitle down → ""
	ev.UserName = h.Resolver.UserName(r.Context(), r.Header.Get("Authorization"), userID)
	if title, err := h.Tasks.TaskTitle(r.Context(), taskID); err == nil {
		ev.TaskTitle = title
	} else if !errors.Is(err, apperr.ErrTasksUnavailable) {
		h.Log.Warn("task title lookup failed", "requestId", RequestID(r.Context()), "err", err.Error())
	}

	if err := h.Store.InsertEvent(r.Context(), ev); err != nil {
		h.Log.Error("insert event failed", "requestId", RequestID(r.Context()), "err", err.Error())
		WriteError(w, r, http.StatusInternalServerError, CodeInternal, "failed to store event", nil)
		return
	}

	h.Log.Info("event ingested",
		slog.String("requestId", RequestID(r.Context())),
		slog.String("taskId", taskID.String()),
		slog.String("action", in.Action),
	)
	writeJSON(w, http.StatusAccepted, map[string]bool{"accepted": true})
}
