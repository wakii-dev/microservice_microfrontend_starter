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
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/consumer"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/logging"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/resolve"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/store"
)

// svcActivityEmail — fixture service user (users.json SF-1) cho service-token.
const svcActivityEmail = "svc-activity@demo.local"

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

	// Service-token (SF-3): login svc-activity lấy JWT cho resolver enrich
	// userName lúc consume. Warmup retry backoff — KHÔNG chặn boot, KHÔNG
	// crash khi auth-mock chưa lên (go chỉ depends_on postgres — conventions/09).
	tokenSource := resolve.NewTokenSource(cfg.AuthMockURL, svcActivityEmail, cfg.SvcActivityPassword)
	go tokenSource.Warmup(context.Background(), log)

	resolver := resolve.New(cfg.SpringSvcURL).WithServiceToken(tokenSource)

	// Kafka consumer (SF-3 — ADR-0008): lazy-connect, broker chưa lên chỉ log
	// warn + retry vòng kế; KHÔNG vào readyz, KHÔNG depends_on.
	publisher := consumer.NewKafkaPublisher(cfg.KafkaBrokers...)
	defer publisher.Close()
	runner := &consumer.Runner{
		Reader:    consumer.NewReader(cfg.KafkaBrokers, cfg.KafkaGroup, cfg.KafkaTopic),
		Handler:   &consumer.Handler{Store: st, Tasks: st, Resolver: resolver, Log: log},
		Publisher: publisher,
		Topic:     cfg.KafkaTopic,
		DLQTopic:  cfg.KafkaDLQTopic,
		Log:       log,
	}
	consumerCtx, stopConsumer := context.WithCancel(context.Background())
	defer stopConsumer()
	go runner.Run(consumerCtx)

	handler := api.NewRouter(api.Deps{
		Log:         log,
		Readiness:   st, // Ready() = migration xong + SELECT probe schema tasks
		CORSOrigins: cfg.CORSDevOrigins,
		JWTSecret:   []byte(cfg.JWTSecret),
		Feed:        &api.FeedHandler{Store: st, Resolver: resolver, Tasks: st, Log: log},
		Stats:       &api.StatsHandler{Store: st, Tasks: st, Log: log},
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
