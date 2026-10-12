package api

import (
	"encoding/json"
	"net/http"
)

// writeJSON helper — encode body + status (Content-Type application/json).
func writeJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
