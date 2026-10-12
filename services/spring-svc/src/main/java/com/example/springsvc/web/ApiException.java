package com.example.springsvc.web;

/**
 * Business error có code theo catalog conventions/04 — map bởi
 * GlobalExceptionHandler thành envelope.
 */
public class ApiException extends RuntimeException {

    private final int status;
    private final String code;

    private ApiException(int status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(400, "VALIDATION_ERROR", message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(404, "NOT_FOUND", message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(409, "CONFLICT", message);
    }

    public int getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
