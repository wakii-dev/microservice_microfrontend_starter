# 04 — Error envelope chung

Mọi HTTP response 4xx/5xx của mọi service dùng **một** shape — mirror trong `components.schemas.Error` của cả 4 OpenAPI specs (spectral rule `error-envelope-shape` warn nếu lệch).

## Shape

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task 9f0e... không tồn tại",
    "requestId": "b1c2...",
    "details": null
  }
}
```

| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `error.code` | ✓ | `SCREAMING_SNAKE` — máy đọc được |
| `error.message` | ✓ | Người đọc được; không chứa secret |
| `error.requestId` | ✓ (nullable) | Echo `X-Request-Id` |
| `error.details` | ✗ | Dữ liệu bổ sung có cấu trúc (vd validation field errors) |

## Code catalog tối thiểu

| Code | HTTP | Dùng khi |
|------|------|----------|
| `VALIDATION_ERROR` | 400 | Payload sai schema |
| `UNAUTHORIZED` | 401 | Thiếu/sai/hết hạn JWT (service tự verify) |
| `NOT_FOUND` | 404 | Resource không tồn tại |
| `CONFLICT` | 409 | Email đã tồn tại… |
| `UNPROCESSABLE` | 422 | Assignee không tồn tại (spring trả 404 khi node validate) |
| `DEPENDENCY_DOWN` | 503 | spring-svc down khi node validate user (fail-closed); go không đọc được schema tasks |
| `INTERNAL` | 500 | Unhandled — KHÔNG lộ stack trong message |

## Quy tắc

1. Fastify/spring/Go framework error mặc định (vd Fastify `FST_ERR_*`) phải được **map sang envelope** bằng error handler riêng.
2. Gateway (nginx) 401 presence-check trả envelope tương tự (`{"error":{"code":"UNAUTHORIZED",...}}`) qua `default.conf` inline response.
3. FE decode envelope bằng helper `decodeErrorEnvelope` trong `frontend/shared` — không tự parse message đáy.
