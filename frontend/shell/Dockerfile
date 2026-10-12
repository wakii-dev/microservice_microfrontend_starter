# Shell — MF host static (SF-5). Multi-stage theo platform/conventions/01-dockerfile-pattern.md.
# Build context = repo ROOT (compose: context .., dockerfile frontend/shell/Dockerfile) —
# cần frontend/shared (workspace dep TS raw) + pnpm-workspace.yaml + lockfile.

# build stage — cài + build rspack
FROM node:22-alpine AS build
WORKDIR /repo
# Pin pnpm 9.15.9 = dev machine + lockfileVersion (corepack default sẽ tải pnpm 12 — lệch format)
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
# COPY đủ MỌI importer trong pnpm-lock.yaml (., shared, shell, spike/host, spike/remote) —
# thiếu importer nào frozen-lockfile cũng fail
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/shared/package.json frontend/shared/
COPY frontend/spike/host/package.json frontend/spike/host/
COPY frontend/spike/remote/package.json frontend/spike/remote/
COPY frontend/shell/package.json frontend/shell/
RUN pnpm install --frozen-lockfile --filter @boilerplate/shell...
COPY frontend/shared frontend/shared
COPY frontend/shell frontend/shell
# Build-time env (conventions/08 — remote registry; mặc định đi qua gateway /remotes/*)
ARG REMOTE_TASKS_URL=/remotes/tasks/remoteEntry.js
ARG REMOTE_ACTIVITY_URL=/remotes/activity/remoteEntry.js
# Prod API base = '' (same-origin qua gateway — conventions/07)
ENV REMOTE_TASKS_URL=${REMOTE_TASKS_URL} \
    REMOTE_ACTIVITY_URL=${REMOTE_ACTIVITY_URL} \
    API_BASE_URL="" \
    NODE_ENV=production
RUN pnpm --filter @boilerplate/shell build

# runtime stage — nginx serve static, port cố định 3000 (conventions/05)
# Healthcheck KHÔNG khai ở đây (conventions/01 rule 4 — một nguồn duy nhất: compose entry `shell`)
FROM nginx:1.27-alpine AS runtime
COPY frontend/shell/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/frontend/shell/dist /usr/share/nginx/html
EXPOSE 3000
