// Auth stub :8090 — đúng contract auth.yaml v2 + token-contract v2 (SF-4 RULE 0 only).
// KHÔNG commit — chỉ để browser walkthrough register→login→logout khi auth-svc (SF-2)
// chưa có trên nhánh. CORS dev mở (mirror auth-mock behavior).
import { createServer } from 'node:http';
import { randomUUID, createHash, randomBytes } from 'node:crypto';

const PORT = Number(process.env.STUB_PORT ?? 8091);
const users = new Map(); // email → {id, email, displayName, roles, password}
const refreshTokens = new Map(); // token → {userId, revoked}

function seed() {
  put('alice@demo.local', '11111111-1111-4111-8111-111111111111', 'Alice', ['admin'], 'demo-password');
  put('bob@demo.local', '22222222-2222-4222-8222-222222222222', 'Bob', ['user'], 'demo-password');
}
function put(email, id, displayName, roles, password) {
  users.set(email.toLowerCase(), { id, email: email.toLowerCase(), displayName, roles, password });
}
seed();

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function makeAccessToken(user) {
  const now = Math.floor(Date.now() / 1000);
  return `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub: user.id, email: user.email, roles: user.roles, iss: 'auth-mock', iat: now, exp: now + 3600 })}.stub-sig`;
}
function makeRefreshToken() {
  return randomBytes(32).toString('base64url');
}
function session(user) {
  const rt = makeRefreshToken();
  refreshTokens.set(rt, { userId: user.id, revoked: false });
  return {
    user: { id: user.id, email: user.email, displayName: user.displayName, roles: user.roles },
    accessToken: makeAccessToken(user),
    refreshToken: rt,
  };
}
const json = (res, status, body) => {
  const data = body === undefined ? undefined : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(data);
};
const envelope = (res, status, code, message) =>
  json(res, status, { error: { code, message, requestId: randomUUID(), details: null } });

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    return res.end();
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const url = req.url.split('?')[0];
    console.log(`${req.method} ${url}`);

    if (req.method === 'GET' && (url === '/healthz' || url === '/api/auth/healthz')) {
      return json(res, 200, { status: 'ok' });
    }

    if (req.method === 'POST' && url === '/api/auth/register') {
      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      const displayName = String(body.displayName ?? '').trim();
      if (!email || !displayName) return envelope(res, 400, 'VALIDATION_ERROR', 'Thiếu email hoặc displayName.');
      if (password.length < 8 || password.length > 72)
        return envelope(res, 400, 'VALIDATION_ERROR', 'Mật khẩu cần 8–72 ký tự.');
      if (users.has(email)) return envelope(res, 409, 'CONFLICT', 'Email đã tồn tại.');
      const user = { id: randomUUID(), email, displayName, roles: ['user'], password };
      users.set(email, user);
      return json(res, 201, session(user));
    }

    if (req.method === 'POST' && url === '/api/auth/login') {
      const email = String(body.email ?? '').trim().toLowerCase();
      const user = users.get(email);
      if (!user || user.password !== String(body.password ?? ''))
        return envelope(res, 401, 'UNAUTHORIZED', 'Email không tồn tại hoặc sai password.');
      return json(res, 200, session(user));
    }

    if (req.method === 'POST' && url === '/api/auth/refresh') {
      const rt = String(body.refreshToken ?? '');
      const row = refreshTokens.get(rt);
      // reuse/revoked/lạ → 401 (strict demo: revoke hết của user nếu biết user)
      if (!row || row.revoked) {
        if (row?.userId) {
          for (const [k, v] of refreshTokens) if (v.userId === row.userId) v.revoked = true;
        }
        return envelope(res, 401, 'UNAUTHORIZED', 'Refresh token lạ hoặc đã revoked.');
      }
      const user = [...users.values()].find((u) => u.id === row.userId);
      if (!user) return envelope(res, 401, 'UNAUTHORIZED', 'User không tồn tại.');
      row.revoked = true; // rotation
      const s = session(user);
      refreshTokens.set(s.refreshToken, { userId: user.id, revoked: false });
      return json(res, 200, { accessToken: s.accessToken, refreshToken: s.refreshToken });
    }

    if (req.method === 'POST' && url === '/api/auth/logout') {
      const rt = String(body.refreshToken ?? '');
      const row = refreshTokens.get(rt);
      if (row) row.revoked = true; // idempotent — luôn 204
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      });
      return res.end();
    }

    return envelope(res, 404, 'NOT_FOUND', `Không có route ${req.method} ${url}`);
  });
});

server.listen(PORT, () => console.log(`auth-stub v2 listening :${PORT}`));
