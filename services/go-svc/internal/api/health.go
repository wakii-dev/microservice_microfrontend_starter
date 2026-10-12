package api

import (
	"encoding/json"
	"net/http"
)

// Healthz — liveness (conventions/02): process sống → 200 {"status":"ok"}.
// Không auth, ngoài prefix /api/activity (naked path).
func Healthz(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// ReadinessChecker kiểm tra ĐẦY ĐỦ điều kiện ready của go-svc
// (conventions/02: migration schema activity xong + SELECT thử được schema tasks).
type ReadinessChecker interface {
	Ready() error
}

// Readyz — readiness: 200 khi checker Ready(), ngược lại 503 error envelope.
func Readyz(checker ReadinessChecker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := checker.Ready(); err != nil {
			WriteError(w, r, http.StatusServiceUnavailable, CodeDependencyDown, err.Error(), nil)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}
}
