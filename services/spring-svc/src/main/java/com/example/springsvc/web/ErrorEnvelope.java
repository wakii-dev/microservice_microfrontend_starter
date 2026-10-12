package com.example.springsvc.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Ghi error envelope conventions/04 thẳng vào response (dùng trong filter,
 * nơi chưa có @RestControllerAdvice).
 */
public final class ErrorEnvelope {

    private ErrorEnvelope() {
    }

    public static void write(HttpServletResponse response, ObjectMapper mapper,
                             int status, String code, String message, String requestId) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        mapper.writeValue(response.getOutputStream(), new ErrorWrapper(ApiError.of(code, message, requestId)));
    }

    // Shape {"error": {...}} — không serialize record ApiError trực tiếp ở top-level
    public record ErrorWrapper(ApiError error) {
    }
}
