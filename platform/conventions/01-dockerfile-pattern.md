# 01 — Dockerfile multi-stage pattern

Mọi service dùng **2 stage**: `deps` (cài dependency, cache được) → `runtime` (copy artifact + prod deps, image mỏng). Không chạy build tool trong runtime image.

## Node (Fastify/TS — node-svc, auth-mock)

```dockerfile
# deps stage
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# runtime stage
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

## Spring Boot (spring-svc)

```dockerfile
# deps stage — mvnw tải dependency vào layer cache riêng
FROM eclipse-temurin:21-jdk-alpine AS deps
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B dependency:go-offline

# build stage
FROM deps AS build
COPY src src
RUN ./mvnw -B package -DskipTests

# runtime stage — JRE-only, jar fat
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER 1001
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## Go (go-svc)

```dockerfile
# build stage
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/go-svc ./cmd/server

# runtime stage — static binary trên distroless
FROM gcr.io/distroless/static-debian12:nonroot AS runtime
COPY --from=build /out/go-svc /go-svc
EXPOSE 8082
ENTRYPOINT ["/go-svc"]
```

## Quy tắc

1. **Pin base image theo digest hoặc minor tag cụ thể** — không `:latest`. SF-7 rà lại lần cuối.
2. Image chạy **non-root** (`USER node` / `USER 1001` / distroless nonroot).
3. `EXPOSE` = port của service theo [05-ports.md](05-ports.md).
4. Healthcheck KHÔNG khai trong Dockerfile — khai trong `platform/docker-compose.yml` (một nguồn duy nhất).
5. Thứ tự `COPY` tối ưu cache: lockfile/manifest trước, source sau.
6. CI boot-smoke build đúng Dockerfile này — nếu build local pass mà CI fail, check `.dockerignore` trước (node_modules/target/bin không được vào context).
7. **Lockfile variant cho workspace member (SF-7 sync — học từ SF-2, improvements-log):** service là member của pnpm workspace nhưng compose build context = **thư mục con** → root `pnpm-lock.yaml` KHÔNG vào được context. Hai cách chuẩn:
   - **Local standalone lockfile** (precedent auth-mock, node-svc): commit `pnpm-lock.yaml` trong thư mục service (sinh bằng `pnpm install --ignore-workspace`), Dockerfile `COPY package.json pnpm-lock.yaml` + `pnpm install --frozen-lockfile`.
   - **Repo-root build context** (precedent shell/remotes): Dockerfile khai `context: ..` + `dockerfile: app/<app>/Dockerfile` để root workspace lockfile + `app/shared` vào được context.
   Đừng trộn: COPY root lockfile trong context thư mục con = build fail lúc deps stage.
