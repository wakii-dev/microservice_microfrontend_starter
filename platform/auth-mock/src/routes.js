// Routes — contract: contracts/openapi/auth.yaml (source of truth)
import jwt from 'jsonwebtoken';

export function signToken({ user, jwtSecret, ttlSeconds, issuer }) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      iss: issuer,
    },
    jwtSecret,
    { algorithm: 'HS256', expiresIn: ttlSeconds }
  );
}

export function registerRoutes(app, { users, jwtSecret, devPassword, ttlSeconds, issuer }) {
  const usersByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  let fixtureLoaded = true; // buildApp đã load trước khi register — ready từ đầu

  // ---- healthcheck (naked path — conventions/02) ----
  app.get('/healthz', async () => ({ status: 'ok' }));
  app.get('/readyz', async (_req, reply) => {
    if (!fixtureLoaded) {
      return reply.status(503).send({
        error: { code: 'NOT_READY', message: 'users fixture not loaded', requestId: null, details: null },
      });
    }
    return { status: 'ok' };
  });

  // ---- login ----
  app.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required', requestId: request.id, details: null },
      });
    }
    const user = usersByEmail.get(email.toLowerCase());
    // Thông báo lỗi chung chung — không lộ email nào tồn tại
    if (!user || password !== devPassword) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials', requestId: request.id, details: null },
      });
    }
    const accessToken = signToken({ user, jwtSecret, ttlSeconds, issuer });
    request.log.info({ email: maskEmail(email) }, 'mock login OK');
    return { accessToken, tokenType: 'Bearer', expiresIn: ttlSeconds };
  });

  // ---- fixture users (demo cho FE login screen) ----
  app.get('/api/auth/users', async () => ({
    users: users.map((u) => ({ id: u.id, email: u.email, roles: u.roles })),
  }));

  // ---- discovery stub OIDC-ready (token-contract.md §6 — không JWKS, HS256) ----
  app.get('/api/auth/.well-known/openid-configuration', async (request) => ({
    issuer: issuer,
    token_endpoint: `${request.protocol}://${request.headers.host}/api/auth/login`,
    grant_types_supported: ['password'],
    // Lưu ý: đây là STUB — OIDC thật khi copy dự án (xem token-contract.md §6)
  }));
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}
