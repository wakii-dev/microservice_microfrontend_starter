# node-svc — multi-stage theo platform/conventions/01-dockerfile-pattern.md
# Lockfile: LOCAL pnpm-lock.yaml (thư mục này, pnpm install --ignore-workspace)
# vì build context = services/node-svc — root workspace lockfile ngoài context.
# Build trong image (CI checkout không có dist/) — tsconfig excludes *.test.ts.
# deps → build (tsc) → runtime (prod node_modules + dist + drizzle migrations).

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
EXPOSE 3001
CMD ["node", "dist/server.js"]
