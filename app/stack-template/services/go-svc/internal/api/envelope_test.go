package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWriteError_EnvelopeShape(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req = req.WithContext(contextWithRequestID(req, "req-42"))
	rec := httptest.NewRecorder()
	WriteError(rec, req, http.StatusBadRequest, CodeValidationError, "bad payload", map[string]string{"field": "action"})

	var got Envelope
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("body not valid JSON: %v — %s", err, rec.Body.String())
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
	if got.Error.Code != "VALIDATION_ERROR" {
		t.Errorf("code = %q, want VALIDATION_ERROR", got.Error.Code)
	}
	if got.Error.RequestID != "req-42" {
		t.Errorf("requestId = %q, want req-42", got.Error.RequestID)
	}
	if got.Error.Details == nil {
		t.Error("details should be carried through")
	}
	// requestId + code đứng cạnh message theo đúng thứ tự field của conventions/04
	if !strings.Contains(rec.Body.String(), "\"requestId\":\"req-42\"") {
		t.Error("requestId missing in JSON body")
	}
}

func assertEnvelope(t *testing.T, body, code, requestID string) {
	t.Helper()
	var got Envelope
	if err := json.Unmarshal([]byte(body), &got); err != nil {
		t.Fatalf("body not valid JSON: %v — %s", err, body)
	}
	if got.Error.Code != code {
		t.Errorf("code = %q, want %q", got.Error.Code, code)
	}
	if got.Error.RequestID != requestID {
		t.Errorf("requestId = %q, want %q", got.Error.RequestID, requestID)
	}
}
