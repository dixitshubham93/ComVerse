package com.projectF.ComVerse.domain.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupRequest {
    @NotBlank(message = "Username is required.")
    private String username;

    @NotBlank(message = "Email cannot be empty.")
    @Email(message = "Please provide a valid email address.")
    private String email;

    @NotBlank(message = "Password cannot be empty.")
    @Size(min = 8, message = "Password must be at least 8 characters long.")
    private String password;

    private String avatarUrl;
    private String bannerUrl;
    private Integer age;
}

