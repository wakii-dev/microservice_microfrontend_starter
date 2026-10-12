// go-svc — activity API (epic FI-62, SF-4 / Linear FI-72).
// Go 1.24 + chi; conventions: platform/conventions/.
package main

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/api"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/config"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/logging"
)

// notReady là readiness stub — T3 thay bằng readiness thật
// (migration schema activity xong + SELECT probe schema tasks).
type notReady struct{}

func (notReady) Ready() error { return errors.New("store not initialized yet") }

func main() {
	cfg, err := config.Load(os.Getenv)
	if err != nil {
		// Fail-fast (conventions/06 rule 6) — không fallback im lặng.
		fmt.Fprintln(os.Stderr, "config error:", err)
		os.Exit(1)
	}
	log := logging.New(cfg.LogLevel)

	handler := api.NewRouter(api.Deps{
		Log:         log,
		Readiness:   &notReady{},
		CORSOrigins: cfg.CORSDevOrigins,
	})

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Info("go-svc starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("server exited", "err", err.Error())
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	log.Info("shutting down")
	_ = srv.Close()
}
