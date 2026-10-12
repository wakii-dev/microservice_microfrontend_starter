# Remote `activity` — MF remote static (SF-6). Multi-stage theo platform/conventions/01-dockerfile-pattern.md.
# Build context = repo ROOT (compose: context .., dockerfile frontend/remotes/activity/Dockerfile) —
# cần frontend/shared (workspace dep TS raw) + pnpm-workspace.yaml + lockfile.

# build stage — cài + build rspack
FROM node:22-alpine AS build
WORKDIR /repo
# Pin pnpm 9.15.9 = dev machine + lockfileVersion (corepack default sẽ tải pnpm 12 — lệch format)
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
# COPY đủ MỌI importer trong pnpm-lock.yaml (., shared, spike/host, spike/remote, shell,
# remotes/tasks, remotes/activity) — thiếu importer nào frozen-lockfile cũng fail
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/shared/package.json frontend/shared/
COPY frontend/spike/host/package.json frontend/spike/host/
COPY frontend/spike/remote/package.json frontend/spike/remote/
COPY frontend/shell/package.json frontend/shell/
COPY frontend/remotes/tasks/package.json frontend/remotes/tasks/
COPY frontend/remotes/activity/package.json frontend/remotes/activity/
RUN pnpm install --frozen-lockfile --filter @boilerplate/remote-activity...
COPY frontend/shared frontend/shared
COPY frontend/remotes/activity frontend/remotes/activity
# Build-time env (conventions/06+08): prod API base = '' (same-origin qua gateway),
# publicPath = /remotes/activity/ (gateway /remotes/<name>/ — conventions/08)
ENV API_BASE_URL="" \
    REMOTE_PUBLIC_PATH="/remotes/activity/" \
    NODE_ENV=production
RUN pnpm --filter @boilerplate/remote-activity build

# runtime stage — nginx serve static, port cố định 4002 (conventions/05)
# Healthcheck KHÔNG khai ở đây (conventions/01 rule 4 — một nguồn duy nhất: compose entry remote-activity)
FROM nginx:1.27-alpine AS runtime
COPY frontend/remotes/activity/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/frontend/remotes/activity/dist /usr/share/nginx/html
EXPOSE 4002
