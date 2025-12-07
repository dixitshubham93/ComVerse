package com.projectF.ComVerse.domain.dtos;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommentDto {
    private Long id;
    private Long postId;
    private Long userId;
    private String content;
    private LocalDateTime createdAt;
}

