// go-svc — activity API (epic FI-62, SF-4 / Linear FI-72).
// Go 1.24 + chi; conventions: platform/conventions/.
package main

import (
	"context"
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
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/resolve"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/store"
)

func main() {
	cfg, err := config.Load(os.Getenv)
	if err != nil {
		// Fail-fast (conventions/06 rule 6) — không fallback im lặng.
		fmt.Fprintln(os.Stderr, "config error:", err)
		os.Exit(1)
	}
	log := logging.New(cfg.LogLevel)

	// DB — 2 pool: owner (go_svc, schema activity) + readonly (go_readonly, schema tasks)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	st, err := store.Open(ctx, cfg.DatabaseURL, cfg.DatabaseReadonlyURL, log)
	if err != nil {
		log.Error("store open failed", "err", err.Error())
		os.Exit(1)
	}
	defer st.Close()

	// Migration schema activity (go-svc OWNS — context pack item 4)
	if err := st.Migrate(ctx); err != nil {
		log.Error("migration failed", "err", err.Error())
		os.Exit(1)
	}

	resolver := resolve.New(cfg.SpringSvcURL)

	handler := api.NewRouter(api.Deps{
		Log:         log,
		Readiness:   st, // Ready() = migration xong + SELECT probe schema tasks
		CORSOrigins: cfg.CORSDevOrigins,
		JWTSecret:   []byte(cfg.JWTSecret),
		Events: &api.EventsHandler{Store: st, Resolver: resolver, Tasks: st, Log: log},
		Feed:   &api.FeedHandler{Store: st, Resolver: resolver, Tasks: st, Log: log},
		Stats:  &api.StatsHandler{Store: st, Tasks: st, Log: log},
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
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}
