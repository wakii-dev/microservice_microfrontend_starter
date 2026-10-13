module github.com/wakii-dev/architecture-overview/services/go-svc

go 1.24

require (
	github.com/go-chi/chi/v5 v5.3.2
	github.com/golang-jwt/jwt/v5 v5.3.1
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.7.5
	github.com/rs/cors v1.11.1
	github.com/segmentio/kafka-go v0.4.47 // ADR-0008: demo consumer — production path là franz-go
)
