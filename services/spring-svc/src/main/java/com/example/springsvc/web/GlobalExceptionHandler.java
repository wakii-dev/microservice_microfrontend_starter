package com.example.springsvc.web;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.HashMap;
import java.util.Map;

/**
 * Map mọi 4xx/5xx về error envelope chung — platform/conventions/04.
 * requestId = echo X-Request-Id (gateway sinh nếu thiếu).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final HttpServletRequest request;

    public GlobalExceptionHandler(HttpServletRequest request) {
        this.request = request;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorEnvelope.ErrorWrapper> apiException(ApiException e) {
        return respond(e.getStatus(), e.getCode(), e.getMessage(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorEnvelope.ErrorWrapper> invalidBody(MethodArgumentNotValidException e) {
        Map<String, String> details = new HashMap<>();
        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            details.put(fe.getField(), fe.getDefaultMessage());
        }
        return respond(400, "VALIDATION_ERROR", "Payload không hợp lệ", details);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, HandlerMethodValidationException.class,
            jakarta.validation.ConstraintViolationException.class})
    public ResponseEntity<ErrorEnvelope.ErrorWrapper> unreadable(Exception e) {
        return respond(400, "VALIDATION_ERROR", "Payload không hợp lệ hoặc sai định dạng", null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorEnvelope.ErrorWrapper> conflict(DataIntegrityViolationException e) {
        return respond(409, "CONFLICT", "Dữ liệu vi phạm ràng buộc (vd email đã tồn tại)", null);
    }

    // Framework 4xx — KHÔNG để rơi vào catch-all 500 (conventions/04: INTERNAL chỉ unhandled)
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ErrorEnvelope.ErrorWrapper> noResource(org.springframework.web.servlet.resource.NoResourceFoundException e) {
        return respond(404, "NOT_FOUND", "Không tìm thấy resource", null);
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorEnvelope.ErrorWrapper> methodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException e) {
        return respond(405, "METHOD_NOT_ALLOWED", "Method không được hỗ trợ", null);
    }

    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorEnvelope.ErrorWrapper> mediaTypeNotSupported(org.springframework.web.HttpMediaTypeNotSupportedException e) {
        return respond(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type không được hỗ trợ", null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorEnvelope.ErrorWrapper> internal(Exception e) {
        // KHÔNG lộ stack trong message (conventions/04) — log đầy đủ có err
        log.error("Unhandled error: {}", e.toString(), e);
        return respond(500, "INTERNAL", "Lỗi không xử lý được", null);
    }

    private ResponseEntity<ErrorEnvelope.ErrorWrapper> respond(
            int status, String code, String message, Object details) {
        String requestId = MDC.get("requestId") != null
                ? MDC.get("requestId")
                : request.getHeader("X-Request-Id");
        return ResponseEntity.status(status)
                .body(new ErrorEnvelope.ErrorWrapper(new ApiError(code, message, requestId, details)));
    }
}
