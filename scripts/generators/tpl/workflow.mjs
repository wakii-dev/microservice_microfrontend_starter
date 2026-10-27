// workflow.mjs — CI workflow per-service (.github/workflows/services-<name>.yml)
// mirror pattern services-node-svc.yml / services-go-svc.yml (boot-smoke healthz/
// readyz + smoke CRUD JWT tự ký). LƯU Ý: compose env luôn --env-file
// platform/.env.example (CLAUDE.md gotchas).

const HEADER = (name, note) =>
  `# Sinh bởi scripts/generators gen-service (${note}) — mirror pattern services-*.yml.
# CI GitHub Actions hiện DISABLE (billing) — file giữ sẵn để bật lại (CLAUDE.md).
`;

const CHECKOUT_STEPS = `      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        # version đọc từ packageManager trong package.json (root) — không khai trùng
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
`;

function tsWorkflow(ctx) {
  const name = ctx.name;
  return (
    HEADER(name, '--lang ts') +
    `name: services-${name}
on:
  push:
    branches: ["**"]
    paths:
      - "services/${name}/**"
      - "platform/docker-compose.yml" # compose entry đổi cũng phải re-test
      - "contracts/openapi/${name}.yaml" # typegen drift + contract
      - ".github/workflows/services-${name}.yml"
  pull_request:
    paths:
      - "services/${name}/**"
      - "platform/docker-compose.yml"
      - "contracts/openapi/${name}.yaml"

permissions:
  contents: read # least-privilege

jobs:
  build-test:
    name: build + test (${name})
    runs-on: ubuntu-latest
    steps:
${CHECKOUT_STEPS}      - name: Install (workspace root, frozen)
        run: pnpm install --frozen-lockfile
      - name: Unit tests
        run: pnpm --filter ${name} test
      - name: Build (tsc)
        run: pnpm --filter ${name} build
      - name: Typegen drift check (contract-first)
        run: |
          pnpm --filter ${name} generate:types
          git diff --exit-code -- services/${name}/src/types/api.d.ts \\
            || (echo "::error::src/types/api.d.ts lệch contracts/openapi/${name}.yaml — chạy generate:types rồi commit" && exit 1)

  docker-build:
    name: docker build (${name})
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build image (multi-stage — platform/conventions/01)
        run: docker build -t ${name}:ci services/${name}

  boot-smoke:
    name: boot-smoke (${name} + postgres, health + CRUD smoke)
    runs-on: ubuntu-latest
    env:
      JWT_SECRET: ci-smoke-secret-placeholder-not-real-32chars
` +
    (ctx.db
      ? `      ${ctx.scream}_DB_PASSWORD: ci-password-not-real
      POSTGRES_PASSWORD: ci-postgres-password-not-real
`
      : `      POSTGRES_PASSWORD: ci-postgres-password-not-real
`) +
    `    steps:
      - uses: actions/checkout@v4
      - name: Boot ${ctx.db ? 'postgres + ' : ''}${name} (compose — env từ .env.example)
        run: |
          docker compose -f platform/docker-compose.yml --env-file platform/.env.example \\
            up -d --build ` +
    (ctx.db ? 'postgres ' : '') +
    name +
    `
      - name: Smoke — healthz/readyz 200
        run: |
          ok=0
          for i in $(seq 1 60); do
            curl -sf http://localhost:` +
    ctx.port +
    `/readyz >/dev/null && ok=1 && break
            sleep 2
          done
          if [ "$ok" != "1" ]; then
            echo "::error::readyz không 200 trong 120s — ${name} logs:"
            docker compose -f platform/docker-compose.yml --env-file platform/.env.example logs ${name} ` +
    (ctx.db ? 'postgres' : '') +
    `
            exit 1
          fi
          curl -sf http://localhost:` +
    ctx.port +
    `/healthz | grep -q '"status":"ok"'
          curl -sf http://localhost:` +
    ctx.port +
    `/readyz | grep -q '"status":"ok"'
      - name: Smoke — items CRUD qua JWT tự ký
        run: |
          TOKEN=$(node -e '
            const c = require("crypto");
            const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
            const h = b({ alg: "HS256", typ: "JWT" });
            const now = Math.floor(Date.now() / 1000);
            const p = b({ sub: "11111111-1111-4111-8111-111111111111", email: "alice@demo.local", roles: ["admin"], iat: now, exp: now + 3600 });
            const s = c.createHmac("sha256", process.env.JWT_SECRET).update(h + "." + p).digest("base64url");
            console.log(h + "." + p + "." + s);')
          BASE=http://localhost:` +
    ctx.port +
    `/api/${name}
          CODE=$(curl -s -o /tmp/item.json -w '%{http_code}' -X POST "$BASE/items" \\
            -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \\
            -d '{"name":"boot-smoke item"}')
          echo "create → $CODE"
          [ "$CODE" = "201" ] || (cat /tmp/item.json && exit 1)
          curl -sf "$BASE/items" -H "Authorization: Bearer $TOKEN" | grep -q 'boot-smoke item'
      - name: Smoke — 401 khi thiếu token (service tự chặn, không nhờ gateway)
        run: |
          CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:` +
    ctx.port +
    `/api/${name}/items)
          [ "$CODE" = "401" ] || (echo "no-token → $CODE (expected 401)" && exit 1)
`
  );
}

function goWorkflow(ctx) {
  const name = ctx.name;
  // go: distroless không healthcheck (conventions/02 rule 3) — compose depends
  // service_started; readiness chứng minh bằng poll từ runner (curl host-side).
  return (
    HEADER(name, '--lang go') +
    `name: services-${name}
on:
  push:
    branches: ["**"]
    paths:
      - "services/${name}/**"
      - "platform/docker-compose.yml"
      - "contracts/openapi/${name}.yaml"
      - ".github/workflows/services-${name}.yml"
  pull_request:
    paths:
      - "services/${name}/**"
      - "platform/docker-compose.yml"
      - "contracts/openapi/${name}.yaml"

permissions:
  contents: read

jobs:
  build-test:
    name: build + test (${name})
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: "1.24" }
      - name: Test
        run: cd services/${name} && go test ./...
      - name: Vet + Build
        run: cd services/${name} && go vet ./... && CGO_ENABLED=0 go build ./...

  docker-build:
    name: docker build (${name})
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build image (conventions/01 — distroless nonroot)
        run: docker build -t ${name}:ci services/${name}

  boot-smoke:
    name: boot-smoke (${name} — poll host-side, distroless không wget)
    runs-on: ubuntu-latest
    env:
      JWT_SECRET: ci-smoke-secret-placeholder-not-real-32chars
      POSTGRES_PASSWORD: ci-postgres-password-not-real
    steps:
      - uses: actions/checkout@v4
      - name: Boot ${name} (compose — env từ .env.example)
        run: |
          docker compose -f platform/docker-compose.yml --env-file platform/.env.example up -d --build ${name}
      - name: Smoke — poll healthz/readyz từ host (port published)
        run: |
          ok=0
          for i in $(seq 1 60); do
            curl -sf http://localhost:${ctx.port}/readyz >/dev/null && ok=1 && break
            sleep 2
          done
          if [ "$ok" != "1" ]; then
            echo "::error::readyz không 200 trong 120s — ${name} logs:"
            docker compose -f platform/docker-compose.yml --env-file platform/.env.example logs ${name}
            exit 1
          fi
          curl -sf http://localhost:${ctx.port}/healthz | grep -q '"status":"ok"'
      - name: Smoke — 401 khi thiếu token
        run: |
          CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:${ctx.port}/api/${name}/items)
          [ "$CODE" = "401" ] || (echo "no-token → $CODE (expected 401)" && exit 1)
`
  );
}

function springWorkflow(ctx) {
  const name = ctx.name;
  return (
    HEADER(name, '--lang spring') +
    `name: services-${name}
on:
  push:
    branches: ["**"]
    paths:
      - "services/${name}/**"
      - "platform/docker-compose.yml"
      - "contracts/openapi/${name}.yaml"
      - ".github/workflows/services-${name}.yml"
  pull_request:
    paths:
      - "services/${name}/**"
      - "platform/docker-compose.yml"
      - "contracts/openapi/${name}.yaml"

permissions:
  contents: read

jobs:
  build-test:
    name: build + test (${name})
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: "21", cache: maven }
      - name: Test
        run: cd services/${name} && ./mvnw -B test

  docker-build:
    name: docker build (${name})
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build image (conventions/01 — temurin JRE alpine, USER 1001)
        run: docker build -t ${name}:ci services/${name}

  boot-smoke:
    name: boot-smoke (${name} — healthz/readyz 200)
    runs-on: ubuntu-latest
    env:
      JWT_SECRET: ci-smoke-secret-placeholder-not-real-32chars
      POSTGRES_PASSWORD: ci-postgres-password-not-real
    steps:
      - uses: actions/checkout@v4
      - name: Boot ${name} (compose — env từ .env.example)
        run: |
          docker compose -f platform/docker-compose.yml --env-file platform/.env.example up -d --build ${name}
      - name: Smoke — healthz/readyz 200
        run: |
          ok=0
          for i in $(seq 1 90); do
            curl -sf http://localhost:${ctx.port}/readyz >/dev/null && ok=1 && break
            sleep 2
          done
          if [ "$ok" != "1" ]; then
            echo "::error::readyz không 200 trong 180s — ${name} logs:"
            docker compose -f platform/docker-compose.yml --env-file platform/.env.example logs ${name}
            exit 1
          fi
          curl -sf http://localhost:${ctx.port}/healthz | grep -q '"status":"ok"'
      - name: Smoke — 401 khi thiếu token
        run: |
          CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:${ctx.port}/api/${name}/items)
          [ "$CODE" = "401" ] || (echo "no-token → $CODE (expected 401)" && exit 1)
`
  );
}

export function workflowYml(lang, ctx) {
  if (lang === 'go') return goWorkflow(ctx);
  if (lang === 'spring') return springWorkflow(ctx);
  return tsWorkflow(ctx);
}
