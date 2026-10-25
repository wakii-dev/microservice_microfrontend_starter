package api

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// statusRecorder bắt status code cho request logger.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// RequestIDMiddleware lấy X-Request-Id (gateway sinh nếu thiếu — conventions/03),
// mirror vào response header + context.
func RequestIDMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id := r.Header.Get("X-Request-Id")
			if id == "" {
				id = uuid.NewString()
			}
			w.Header().Set("X-Request-Id", id)
			next.ServeHTTP(w, r.WithContext(contextWithRequestID(r, id)))
		})
	}
}

// RequestLoggerMiddleware log 1 dòng JSON/request theo conventions/03.
func RequestLoggerMiddleware(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rec, r)
			log.Info("request",
				slog.String("requestId", RequestID(r.Context())),
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", rec.status),
				slog.Int64("durationMs", time.Since(start).Milliseconds()),
			)
		})
	}
}

// RecoverMiddleware bắt panic → 500 envelope (không lộ stack cho client);
// stack nằm trong log server-side (conventions/03 rule 2).
func RecoverMiddleware(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					log.Error("panic recovered",
						slog.String("requestId", RequestID(r.Context())),
						slog.String("err", toString(rec)),
					)
					WriteError(w, r, http.StatusInternalServerError, CodeInternal, "internal server error", nil)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

func toString(v interface{}) string {
	if err, ok := v.(error); ok {
		return err.Error()
	}
	if s, ok := v.(string); ok {
		return s
	}
	return "unknown panic value"
}
