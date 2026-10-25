// Package logging dựng slog JSON handler đúng shape chung (platform/conventions/03):
// {"ts":"...","level":"info","service":"go-svc","msg":"...", ...}
package logging

import (
	"log/slog"
	"os"
	"strings"
	"time"
)

const ServiceName = "go-svc"

// New trả về *slog.Logger JSON ra stdout, level theo env LOG_LEVEL.
func New(level string) *slog.Logger {
	var lv slog.Level
	switch strings.ToLower(level) {
	case "debug":
		lv = slog.LevelDebug
	case "warn":
		lv = slog.LevelWarn
	case "error":
		lv = slog.LevelError
	default:
		lv = slog.LevelInfo
	}

	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: lv,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			switch a.Key {
			case slog.TimeKey:
				// ts: ISO 8601 UTC, độ chính xác ms (conventions/03)
				if t, ok := a.Value.Any().(time.Time); ok {
					return slog.String("ts", t.UTC().Format("2006-01-02T15:04:05.000Z"))
				}
				a.Key = "ts"
				return a
			case slog.LevelKey:
				if l, ok := a.Value.Any().(slog.Level); ok {
					return slog.String("level", strings.ToLower(l.String()))
				}
				return a
			}
			return a
		},
	})
	return slog.New(h).With(slog.String("service", ServiceName))
}
