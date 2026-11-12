package com.renthub.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.util.Map;

@Getter
@JsonInclude(JsonInclude.Include.ALWAYS)
public class ErrorResponse {

    private final boolean success;
    private final String message;
    private final Object data;
    private final Map<String, String> errors;

    public ErrorResponse(String message) {
        this(false, message, null, null);
    }

    public ErrorResponse(String message, Map<String, String> errors) {
        this(false, message, null, errors);
    }

    public ErrorResponse(
            boolean success,
            String message,
            Object data,
            Map<String, String> errors
    ) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errors = errors;
    }
}
