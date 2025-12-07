package com.projectF.ComVerse.domain.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {
    @NotBlank(message = "Email cannot be empty.")
    @Email(message = "Please provide a valid email address.")
    private String email;

    @NotBlank(message = "Password cannot be empty.")
    private String password;
}

