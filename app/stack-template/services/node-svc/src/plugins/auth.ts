// auth.ts — JWT guard (token-contract.md §4 lớp 2): service TỰ verify
// signature (HS256 + JWT_SECRET) + expiry + iss, KHÔNG tin gateway.
// healthz/readyz/docs được exempt. Fail → 401 envelope UNAUTHORIZED.
import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

export const JWT_ISSUER = 'auth-mock';

export interface JwtUser {
  sub: string;
  email: string;
  roles: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtUser;
    bearerToken?: string;
  }
}

export function verifyToken(
  authorization: string | undefined,
  jwtSecret: string,
): { ok: true; user: JwtUser; token: string } | { ok: false; reason: string } {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return { ok: false, reason: 'missing bearer token' };
  }
  const token = authorization.slice('Bearer '.length).trim();
  try {
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
    });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      return { ok: false, reason: 'invalid claims' };
    }
    return {
      ok: true,
      token,
      user: {
        sub: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : '',
        roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
      },
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'verify failed' };
  }
}

/** onRequest hook cho business routes — mount trong plugin có prefix /api/tasks. */
export function authGuard(jwtSecret: string, exemptExact: string[] = ['/healthz', '/readyz']) {
  return (request: FastifyRequest, reply: FastifyReply, done: () => void): void => {
    const path = request.routeOptions?.url ?? '';
    if (exemptExact.some((p) => path === p || path.startsWith('/docs'))) {
      done();
      return;
    }
    const result = verifyToken(request.headers.authorization, jwtSecret);
    if (!result.ok) {
      reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid JWT',
          requestId: request.id,
          details: null,
        },
      });
      return;
    }
    request.user = result.user;
    request.bearerToken = result.token;
    done();
  };
}
