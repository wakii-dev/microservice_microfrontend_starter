package api

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rs/cors"
)

// Deps chứa mọi dependency router cần — inject từ main (testable).
type Deps struct {
	Log         *slog.Logger
	Readiness   ReadinessChecker
	CORSOrigins []string
}

// NewRouter dựng chi router:
//   - naked /healthz + /readyz (ngoài prefix — conventions/02 rule 5)
//   - /api/activity/* — business routes (gateway pass-through, conventions/08)
func NewRouter(d Deps) http.Handler {
	r := chi.NewRouter()

	r.Use(RequestIDMiddleware())
	r.Use(RecoverMiddleware(d.Log))
	r.Use(RequestLoggerMiddleware(d.Log))

	// CORS dev-profile (conventions/07): origin list từ CORS_DEV_ORIGIN;
	// rỗng (prod/compose) → không emit ACAO nào = deny-by-default.
	c := cors.New(cors.Options{
		AllowedOrigins: d.CORSOrigins,
		AllowedMethods: []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Authorization", "Content-Type", "X-Request-Id"},
	})
	r.Use(c.Handler)

	r.Get("/healthz", Healthz)
	r.Get("/readyz", Readyz(d.Readiness))

	r.Route("/api/activity", func(ar chi.Router) {
		// T2 (JWT middleware) + T4/T5 (events/feed/stats) mount tại đây.
		ar.NotFound(func(w http.ResponseWriter, req *http.Request) {
			WriteError(w, req, http.StatusNotFound, CodeNotFound, "route not found", nil)
		})
	})

	return r
}
