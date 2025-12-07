package com.projectF.ComVerse.domain.dtos;


import lombok.Data;

@Data
public class MessageRequestDto {
    private Long userId;
    private String content;
    private String contentType;
}
