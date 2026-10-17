# Remote `tasks` — MF remote static (SF-6). Multi-stage theo platform/conventions/01-dockerfile-pattern.md.
# Build context = repo ROOT (compose: context .., dockerfile app/remotes/tasks/Dockerfile) —
# cần app/shared (workspace dep TS raw) + pnpm-workspace.yaml + lockfile.

# build stage — cài + build rspack
FROM node:22-alpine AS build
WORKDIR /repo
# Pin pnpm 9.15.9 = dev machine + lockfileVersion (corepack default sẽ tải pnpm 12 — lệch format)
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
# COPY đủ MỌI importer trong pnpm-lock.yaml (., shared, spike/host, spike/remote, shell,
# remotes/tasks, remotes/activity) — thiếu importer nào frozen-lockfile cũng fail
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY app/shared/package.json app/shared/
COPY app/spike/host/package.json app/spike/host/
COPY app/spike/remote/package.json app/spike/remote/
COPY app/shell/package.json app/shell/
COPY app/remotes/tasks/package.json app/remotes/tasks/
COPY app/remotes/activity/package.json app/remotes/activity/
RUN pnpm install --frozen-lockfile --filter @boilerplate/remote-tasks...
COPY app/shared app/shared
COPY app/remotes/tasks app/remotes/tasks
# Build-time env (conventions/06+08): prod API base = '' (same-origin qua gateway),
# publicPath = /remotes/tasks/ (gateway /remotes/<name>/ — conventions/08)
ENV API_BASE_URL="" \
    REMOTE_PUBLIC_PATH="/remotes/tasks/" \
    NODE_ENV=production
RUN pnpm --filter @boilerplate/remote-tasks build

# runtime stage — nginx serve static, port cố định 4001 (conventions/05)
# Healthcheck KHÔNG khai ở đây (conventions/01 rule 4 — một nguồn duy nhất: compose entry remote-tasks)
FROM nginx:1.27-alpine AS runtime
COPY app/remotes/tasks/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/app/remotes/tasks/dist /usr/share/nginx/html
EXPOSE 4001
