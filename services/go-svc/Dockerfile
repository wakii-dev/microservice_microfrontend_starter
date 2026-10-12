# go-svc — multi-stage distroless (platform/conventions/01).
# Lệch nhỏ có chủ đích (dev machine không có Go — SF-4 README có ghi chú):
# conventions/01 template COPY go.mod go.sum — go.sum không sinh được trên dev
# machine (không toolchain), nên `go mod tidy` sinh go.sum in-image trước build.

# build stage
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
# go.sum không commit (dev machine không có Go) — tidy sinh trước build
RUN go mod tidy && CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/go-svc ./cmd/server

# runtime stage — static binary trên distroless
FROM gcr.io/distroless/static-debian12:nonroot AS runtime
COPY --from=build /out/go-svc /go-svc
EXPOSE 8082
ENTRYPOINT ["/go-svc"]
