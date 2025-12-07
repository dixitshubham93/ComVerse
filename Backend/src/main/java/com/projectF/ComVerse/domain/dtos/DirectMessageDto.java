package com.projectF.ComVerse.domain.dtos;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DirectMessageDto {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String content;
    private LocalDateTime createdAt;
    private boolean read;
}
