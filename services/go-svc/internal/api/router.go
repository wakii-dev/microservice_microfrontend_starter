package api

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/rs/cors"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/swagger"
)

// Deps chứa mọi dependency router cần — inject từ main (testable).
type Deps struct {
	Log         *slog.Logger
	Readiness   ReadinessChecker
	CORSOrigins []string
	JWTSecret   []byte
	Events      *EventsHandler
	Feed        *FeedHandler
	Stats       *StatsHandler
}

// NewRouter dựng chi router:
//   - naked /healthz + /readyz (ngoài prefix — conventions/02 rule 5)
//   - /api/activity/* — business routes (gateway pass-through, conventions/08)
//       - /docs + /openapi.yaml — auth-exempt (tiền lệ auth-mock /api/auth/docs)
//       - /events, /feed, /stats — JWT bắt buộc (token contract §4)
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
		// swagger static — KHÔNG auth (browser demo swagger-ui; gateway vẫn
		// presence-check qua :8080 nên demo browser dùng direct :8082 — README)
		ar.Get("/openapi.yaml", ServeOpenAPISpec)
		ar.Mount("/docs", swagger.Handler("/api/activity/docs"))

		// business routes — JWT bắt buộc
		ar.Group(func(g chi.Router) {
			g.Use(JWTMiddleware(d.JWTSecret))
			g.Post("/events", d.Events.Ingest)
			g.Get("/feed", d.Feed.List)
			g.Get("/stats", d.Stats.Get)
		})

		ar.NotFound(func(w http.ResponseWriter, req *http.Request) {
			WriteError(w, req, http.StatusNotFound, CodeNotFound, "route not found", nil)
		})
	})

	return r
}
