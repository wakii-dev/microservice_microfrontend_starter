package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret-at-least-32-characters!"

// mintToken ký JWT HS256 theo token contract (dùng chung cho auth tests).
func mintToken(sub, iss string, iat, exp int64, secret []byte) string {
	claims := jwt.MapClaims{
		"sub":   sub,
		"email": "alice@demo.local",
		"roles": []string{"admin"},
		"iss":   iss,
		"iat":   iat,
		"exp":   exp,
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, _ := tok.SignedString(secret)
	return s
}

func TestJWTMiddleware_TokenMatrix(t *testing.T) {
	now := time.Now().Unix()
	valid := mintToken("11111111-1111-4111-8111-111111111111", "auth-mock", now-10, now+3600, []byte(testSecret))
	expired := mintToken("11111111-1111-4111-8111-111111111111", "auth-mock", now-7200, now-3600, []byte(testSecret))
	wrongIss := mintToken("11111111-1111-4111-8111-111111111111", "other-issuer", now-10, now+3600, []byte(testSecret))
	wrongSig := mintToken("11111111-1111-4111-8111-111111111111", "auth-mock", now-10, now+3600, []byte("another-secret-at-least-32-chars"))

	// alg-swap: HS256 token nhưng header khai none — phải bị chặn bởi WithValidMethods
	noneTok := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
		"sub": "x", "iss": "auth-mock", "exp": now + 3600,
	})
	noneStr, _ := noneTok.SignedString(jwt.UnsafeAllowNoneSignatureType)

	cases := []struct {
		name   string
		header string
		want   int
	}{
		{"valid token", "Bearer " + valid, http.StatusOK},
		{"missing header", "", http.StatusUnauthorized},
		{"not bearer", "Basic " + valid, http.StatusUnauthorized},
		{"garbage token", "Bearer abc.def.ghi", http.StatusUnauthorized},
		{"expired", "Bearer " + expired, http.StatusUnauthorized},
		{"wrong issuer", "Bearer " + wrongIss, http.StatusUnauthorized},
		{"wrong signature", "Bearer " + wrongSig, http.StatusUnauthorized},
		{"alg none", "Bearer " + noneStr, http.StatusUnauthorized},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			srv := httptest.NewServer(JWTMiddleware([]byte(testSecret))(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				c := ClaimsFromContext(r.Context())
				if c == nil || c.Sub != "11111111-1111-4111-8111-111111111111" {
					t.Errorf("claims not propagated: %+v", c)
				}
				w.WriteHeader(http.StatusOK)
			})))
			defer srv.Close()

			req, _ := http.NewRequest(http.MethodGet, srv.URL, nil)
			if tc.header != "" {
				req.Header.Set("Authorization", tc.header)
			}
			res, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("request: %v", err)
			}
			defer res.Body.Close()
			if res.StatusCode != tc.want {
				t.Errorf("status = %d, want %d", res.StatusCode, tc.want)
			}
			if tc.want == http.StatusUnauthorized {
				assertEnvelope(t, readAll(t, res), CodeUnauthorized, "")
			}
		})
	}
}

func readAll(t *testing.T, res *http.Response) string {
	t.Helper()
	buf := make([]byte, 4096)
	n, _ := res.Body.Read(buf)
	return string(buf[:n])
}
