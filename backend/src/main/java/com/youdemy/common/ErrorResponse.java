package com.youdemy.common;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
        boolean success,
        String code,
        String message,
        Map<String, String> fieldErrors,
        Instant timestamp,
        String path
) {
}
