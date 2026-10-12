package api

// openapi.go — serve bản copy OpenAPI activity spec (swagger-ui load).
// Spec nguồn sự thật là contracts/openapi/activity.yaml — openapi_test.go
// sync-check chống drift giữa bản copy và contract.

import (
	"embed"
	"net/http"
)

//go:embed openapi/activity.yaml
var activitySpecFS embed.FS

// OpenAPISpec trả nội dung spec (exported cho sync test).
func OpenAPISpec() ([]byte, error) {
	return activitySpecFS.ReadFile("openapi/activity.yaml")
}

// ServeOpenAPISpec — GET /api/activity/openapi.yaml (auth-exempt, swagger-ui load).
func ServeOpenAPISpec(w http.ResponseWriter, _ *http.Request) {
	b, err := OpenAPISpec()
	if err != nil {
		http.Error(w, "spec not available", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/yaml")
	_, _ = w.Write(b)
}
