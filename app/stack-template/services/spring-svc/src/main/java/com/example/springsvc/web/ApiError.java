package com.example.springsvc.web;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Error envelope chung — platform/conventions/04.
 * Body: {"error":{"code","message","requestId","details"}}
 */
@JsonInclude(JsonInclude.Include.ALWAYS)
public record ApiError(String code, String message, String requestId, Object details) {

    public static ApiError of(String code, String message, String requestId) {
        return new ApiError(code, message, requestId, null);
    }
}
