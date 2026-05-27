package com.example.outletmanagement.exception;

import com.example.outletmanagement.payload.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ================= VALIDATION ERRORS =================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidation(
            MethodArgumentNotValidException ex
    ) {
        Map<String, String> errors = new LinkedHashMap<>();

        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        return ResponseEntity.badRequest().body(
                ApiResponse.builder()
                        .httpStatus(HttpStatus.BAD_REQUEST.value())
                        .message("Validation failed")
                        .data(errors)
                        .build()
        );
    }

    // ================= BAD CREDENTIALS =================

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse> handleBadCredentials(
            BadCredentialsException ex
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiResponse.builder()
                        .httpStatus(HttpStatus.UNAUTHORIZED.value())
                        .message(ex.getMessage())
                        .data(null)
                        .build()
        );
    }

    // ================= DATA INTEGRITY =================

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> handleDataIntegrity(
            org.springframework.dao.DataIntegrityViolationException ex
    ) {
        logger.error("Data Integrity Violation", ex);
        String msg = "Data integrity violation - possible duplicate record";
        if (ex.getMostSpecificCause() != null && ex.getMostSpecificCause().getMessage().contains("Duplicate entry")) {
            msg = "Duplicate entry found: " + ex.getMostSpecificCause().getMessage();
        }

        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                ApiResponse.builder()
                        .httpStatus(HttpStatus.CONFLICT.value())
                        .message(msg)
                        .data(null)
                        .build()
        );
    }

    // ================= RESOURCE ALREADY EXISTS =================

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<ApiResponse> handleResourceAlreadyExists(
            ResourceAlreadyExistsException ex
    ) {
        logger.error("Resource Already Exists Exception", ex);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                ApiResponse.builder()
                        .httpStatus(HttpStatus.CONFLICT.value())
                        .message(ex.getMessage())
                        .data(null)
                        .build()
        );
    }

    // ================= RUNTIME EXCEPTION =================

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse> handleRuntime(
            RuntimeException ex
    ) {
        logger.error("Runtime Exception", ex);

        return ResponseEntity.badRequest().body(
                ApiResponse.builder()
                        .httpStatus(HttpStatus.BAD_REQUEST.value())
                        .message(ex.getMessage())
                        .data(null)
                        .build()
        );
    }

    // ================= GENERIC EXCEPTION =================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGeneric(
            Exception ex
    ) {
        logger.error("Unexpected Exception", ex);
        
        String message = "Internal Server Error: " + ex.getMessage();
        if (ex.getCause() != null) {
            message += " | Cause: " + ex.getCause().getMessage();
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.builder()
                        .httpStatus(HttpStatus.INTERNAL_SERVER_ERROR.value())
                        .message(message)
                        .data(null)
                        .build()
        );
    }
}
