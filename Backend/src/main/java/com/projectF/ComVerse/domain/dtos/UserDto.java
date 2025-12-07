package com.projectF.ComVerse.domain.dtos;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String password;
    private String avatarUrl;
    private String bannerUrl;
    private Integer age;
}
