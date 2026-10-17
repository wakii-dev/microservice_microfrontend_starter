# auth-svc — multi-stage theo platform/conventions/01-dockerfile-pattern.md
# Lockfile: LOCAL pnpm-lock.yaml (thư mục này, pnpm install --ignore-workspace)
# vì build context = services/auth-svc — root workspace lockfile ngoài context.
# Build trong image (CI checkout không có dist/) — tsconfig excludes *.test.ts
# và *.test-support.ts.
# argon2: @node-rs/argon2 = napi prebuilt (kể cả linux-x64-musl) — KHÔNG cần
# python/make/g++ trong image (lý do chọn thay node-argon2 native-gyp).
# users.json KHÔNG nằm trong image — mount runtime từ contracts/auth/users.json
# (USERS_FIXTURE_PATH, compose SF-5 + CI boot-smoke mount — sửa fixture không
# cần rebuild, giống auth-mock).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN pnpm exec tsc -p tsconfig.json

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# migration chạy lúc boot (server.ts) — folder phải nằm cạnh dist/../drizzle
COPY drizzle ./drizzle
COPY package.json ./
USER node
EXPOSE 8090
CMD ["node", "dist/server.js"]
