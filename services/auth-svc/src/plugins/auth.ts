// auth.ts — JWT verify cho endpoint CẦN Bearer (logout-all). auth-svc là
// ISSUER của token, nhưng logout-all tự verify đúng luật lớp 2 (token-contract
// §6): signature HS256 + expiry + iss LITERAL "auth-mock" — giá trị PINNED,
// ⚠️ KHÔNG đổi thành "auth-svc" (3 service + 2 CI workflow hardcode chuỗi này;
// đổi = follow-up riêng ngoài epic — token-contract.md §8).
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
  }
}

export function verifyToken(
  authorization: string | undefined,
  jwtSecret: string,
): { ok: true; user: JwtUser } | { ok: false; reason: string } {
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

/** preHandler cho logout-all — fail → 401 envelope UNAUTHORIZED (conventions/04). */
export function requireBearer(jwtSecret: string) {
  return (request: FastifyRequest, reply: FastifyReply, done: () => void): void => {
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
    done();
  };
}
