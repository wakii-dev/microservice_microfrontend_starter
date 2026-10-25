// Package api — HTTP handlers của go-svc.
// envelope.go: error envelope chung (platform/conventions/04).
package api

import (
	"context"
	"encoding/json"
	"net/http"
)

// ctxKey holds context keys used across middlewares/handlers.
type ctxKey int

const ctxKeyRequestID ctxKey = iota

// RequestID trả request id từ context (đặt bởi RequestIDMiddleware).
func RequestID(ctx context.Context) string {
	if v, ok := ctx.Value(ctxKeyRequestID).(string); ok {
		return v
	}
	return ""
}

func contextWithRequestID(r *http.Request, id string) context.Context {
	return context.WithValue(r.Context(), ctxKeyRequestID, id)
}

// Envelope là shape lỗi chung — mirror components.schemas.Error trong
// contracts/openapi/activity.yaml + platform/conventions/04-error-envelope.md.
type Envelope struct {
	Error ErrorBody `json:"error"`
}

type ErrorBody struct {
	Code      string      `json:"code"`
	Message   string      `json:"message"`
	RequestID string      `json:"requestId"`
	Details   interface{} `json:"details"` // nullable
}

// Error codes — catalog tối thiểu conventions/04.
const (
	CodeValidationError  = "VALIDATION_ERROR"
	CodeUnauthorized     = "UNAUTHORIZED"
	CodeNotFound         = "NOT_FOUND"
	CodeDependencyDown   = "DEPENDENCY_DOWN"
	CodeInternal         = "INTERNAL"
)

// WriteError ghi error envelope + status. Không bao giờ lộ stack trong message.
func WriteError(w http.ResponseWriter, r *http.Request, status int, code, message string, details interface{}) {
	body := Envelope{Error: ErrorBody{
		Code:      code,
		Message:   message,
		RequestID: RequestID(r.Context()),
		Details:   details,
	}}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
