package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.dtos.*;
import com.projectF.ComVerse.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserDto>> signup(@Valid @RequestBody SignupRequest request) {
        try {
            // Check if required fields are missing
            if (request.getUsername() == null || request.getUsername().trim().isEmpty() ||
                request.getEmail() == null || request.getEmail().trim().isEmpty() ||
                request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Required fields are missing. Please fill out all mandatory inputs."));
            }

            UserDto user = userService.createUserFromSignupRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Account created successfully!", user));
        } catch (RuntimeException e) {
            // Let GlobalExceptionHandler handle specific errors
            throw e;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDto>> login(@Valid @RequestBody LoginRequest request) {
        try {
            // Check if required fields are missing
            if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
                request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Required fields are missing. Please fill out all mandatory inputs."));
            }

            UserDto user = userService.authenticateUser(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful!", user));
        } catch (RuntimeException e) {
            // Let GlobalExceptionHandler handle specific errors
            throw e;
        }
    }
}

