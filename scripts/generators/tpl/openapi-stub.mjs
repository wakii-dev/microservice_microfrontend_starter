// openapi-stub.mjs — stub contracts/openapi/<name>.yaml spectral-pass
// (mirror shapes của tasks.yaml: Error envelope conventions/04, responses
// components, security bearerAuth). SAMPLE /items — thay bằng domain thật.

export function openapiStub({ name, pascal, date }) {
  return `openapi: 3.0.3
info:
  title: ${pascal} API (${name})
  version: 0.1.0
  description: |
    Stub sinh bởi scripts/generators gen-service (${date}).
    THAY resource /items bằng domain thật — contract-first: sửa file này TRƯỚC,
    code theo sau (nguyên tắc vàng CLAUDE.md), rồi \`pnpm lint:contracts\`.
    Gateway route \`/api/${name}/*\` pass-through — service mount đúng prefix này
    (servers.url khớp, conventions/08).
  contact:
    name: boilerplate epic FI-62
servers:
  - url: /api/${name}
tags:
  - name: ${name}
security:
  - bearerAuth: []
paths:
  /healthz:
    get:
      tags: [${name}]
      summary: Liveness probe
      operationId: getHealthz
      security: [] # probes không-auth (conventions/02)
      responses:
        "200":
          description: Service sống
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthStatus"
  /readyz:
    get:
      tags: [${name}]
      summary: Readiness probe (deps thật — conventions/02 rule 2)
      operationId: getReadyz
      security: []
      responses:
        "200":
          description: Sẵn sàng nhận traffic
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthStatus"
        "503":
          description: Chưa sẵn sàng
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
  /items:
    get:
      tags: [${name}]
      summary: "[SAMPLE] Liệt kê items — thay bằng resource domain thật"
      operationId: listItems
      parameters:
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: offset
          in: query
          required: false
          schema:
            type: integer
            minimum: 0
            default: 0
      responses:
        "200":
          description: Danh sách items
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ItemList"
        "401":
          $ref: "#/components/responses/Unauthorized"
    post:
      tags: [${name}]
      summary: "[SAMPLE] Tạo item — thay bằng resource domain thật"
      operationId: createItem
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateItemRequest"
      responses:
        "201":
          description: Item đã tạo
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Item"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  responses:
    Unauthorized:
      description: Thiếu/sai JWT (gateway presence-check + service verify signature)
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
    BadRequest:
      description: Payload sai schema
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
  schemas:
    HealthStatus:
      type: object
      required: [status]
      properties:
        status:
          type: string
          enum: [ok]
    Error:
      type: object
      description: Error envelope chung — shape chuẩn hoá trong platform/conventions/04-error-envelope.md
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
              description: Mã máy đọc được, vd VALIDATION_ERROR / UNAUTHORIZED / NOT_FOUND
            message:
              type: string
            requestId:
              type: string
              nullable: true
            details:
              description: Tuỳ service — dữ liệu bổ sung có cấu trúc
              nullable: true
    Item:
      type: object
      required: [id, name, createdAt]
      properties:
        id:
          type: string
        name:
          type: string
        createdAt:
          type: string
          format: date-time
    ItemList:
      type: object
      required: [items, total]
      properties:
        items:
          type: array
          items:
            $ref: "#/components/schemas/Item"
        total:
          type: integer
    CreateItemRequest:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 200
`;
}
