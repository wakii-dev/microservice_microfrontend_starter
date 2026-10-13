// Package swagger — swagger-ui static serve OpenAPI activity spec.
// KHÔNG swag codegen — spec là nguồn (epic spec SF-4 item 10).
// swagger-ui-dist v5.17.14 vendored (Apache-2.0 — xem assets/LICENSE + assets/NOTICE).
// Auth-exempt (tiền lệ auth-mock /api/auth/docs mở — contracts.yml verify qua gateway).
package swagger

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed assets
var assetsFS embed.FS

//go:embed index.html
var indexHTML []byte

// Handler trả http.Handler phục vụ swagger UI + assets dưới mountPath
// (vd "/api/activity/docs"). index.html load spec từ "openapi.yaml"
// relative → mountPath + "/../openapi.yaml" do router expose.
func Handler(mountPath string) http.Handler {
	assetsSub, err := fs.Sub(assetsFS, "assets")
	if err != nil {
		panic("swagger assets embed broken: " + err.Error())
	}
	fileServer := http.StripPrefix(mountPath+"/", http.FileServer(http.FS(assetsSub)))

	mux := http.NewServeMux()
	// exact: index.html
	mux.HandleFunc(mountPath, func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write(indexHTML)
	})
	// subtree: swagger-ui.css / swagger-ui-bundle.js / favicon
	mux.Handle(mountPath+"/", fileServer)
	return mux
}
