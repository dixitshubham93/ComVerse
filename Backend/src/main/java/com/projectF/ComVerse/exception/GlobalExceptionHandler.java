package com.projectF.ComVerse.exception;

import com.projectF.ComVerse.domain.dtos.ApiResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Some fields are invalid.", errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolationException(
            ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String fieldName = violation.getPropertyPath().toString();
            String errorMessage = violation.getMessage();
            errors.put(fieldName, errorMessage);
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Some fields are invalid.", errors));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex) {
        String message = ex.getMessage();
        
        if (message != null) {
            if (message.contains("email") || message.contains("users.email")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("This email is already in use."));
            }
            if (message.contains("username") || message.contains("users.username")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("This username is already taken."));
            }
            if (message.contains("name") || message.contains("communities.name")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("Community name already exists. Try another name."));
            }
        }

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("This value must be unique. Please try a different one."));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();
        
        if (message != null) {
            // Handle specific error messages
            if (message.contains("email") && message.contains("already")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("This email is already in use."));
            }
            if (message.contains("username") && message.contains("already")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("This username is already taken."));
            }
            if (message.contains("Community name already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("Community name already exists. Try another name."));
            }
            if (message.contains("not found") || message.contains("Not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error(message));
            }
            if (message.contains("Incorrect email or password") || 
                message.contains("Invalid credentials") ||
                message.contains("Invalid email or password")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Incorrect email or password."));
            }
        }

        // Generic error for other runtime exceptions
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Something went wrong on our side. Please try again later."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Something went wrong on our side. Please try again later."));
    }
}

