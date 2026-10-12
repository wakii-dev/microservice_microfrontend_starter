package api

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// JWT enforcement lớp 2 (contracts/auth/token-contract.md §4):
// go-svc TỰ verify signature (HS256 + JWT_SECRET) + expiry (exp) + iss=auth-mock.
// KHÔNG tin presence-check của gateway — sai/hết hạn → 401 envelope.
const expectedJWTIssuer = "auth-mock"

// ctxKeyClaims holds verified JWT claims.
const ctxKeyClaims ctxKey = 1

// Claims là tập claim go-svc dùng (token contract §1).
type Claims struct {
	Sub   string   // user id UUID (khớp users fixture)
	Email string
	Roles []string
}

// ClaimsFromContext trả claims đã verify, nil nếu route không qua JWT middleware.
func ClaimsFromContext(ctx context.Context) *Claims {
	if v, ok := ctx.Value(ctxKeyClaims).(*Claims); ok {
		return v
	}
	return nil
}

// JWTMiddleware verify Bearer token trên business routes.
func JWTMiddleware(secret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := verifyJWT(r.Header.Get("Authorization"), secret)
			if err != nil {
				WriteError(w, r, http.StatusUnauthorized, CodeUnauthorized, "invalid or expired token", nil)
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxKeyClaims, claims)))
		})
	}
}

// verifyJWT parse + validate token theo token contract. Exported cho test.
func verifyJWT(header string, secret []byte) (*Claims, error) {
	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return nil, jwt.ErrTokenMalformed
	}
	tokenStr := strings.TrimPrefix(header, prefix)

	parsed, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return secret, nil
	},
		jwt.WithValidMethods([]string{"HS256"}), // chống alg-swap
		jwt.WithIssuer(expectedJWTIssuer),
		jwt.WithExpirationRequired(), // exp bắt buộc (contract TTL 8h)
	)
	if err != nil || !parsed.Valid {
		return nil, err
	}
	mc, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return nil, jwt.ErrTokenInvalidClaims
	}
	sub, _ := mc["sub"].(string)
	if sub == "" {
		return nil, jwt.ErrTokenInvalidClaims
	}
	email, _ := mc["email"].(string)
	rawRoles, _ := mc["roles"].([]interface{})
	roles := make([]string, 0, len(rawRoles))
	for _, rr := range rawRoles {
		if s, ok := rr.(string); ok {
			roles = append(roles, s)
		}
	}
	return &Claims{Sub: sub, Email: email, Roles: roles}, nil
}
