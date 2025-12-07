package com.projectF.ComVerse.domain.dtos;

import lombok.Data;

@Data
public class CreateCommentRequest {
    private Long userId;
    private Long postId;
    private String content;
}
