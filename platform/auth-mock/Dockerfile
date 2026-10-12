# Multi-stage pattern — platform/conventions/01-dockerfile-pattern.md (Node variant)
# deps stage
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN corepack enable && (test -f pnpm-lock.yaml && pnpm install --frozen-lockfile || npm install --omit=dev)

# runtime stage
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./
USER node
EXPOSE 8090
CMD ["node", "src/server.js"]
