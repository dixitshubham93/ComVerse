package com.projectF.ComVerse.domain.dtos;

import com.projectF.ComVerse.domain.enums.PostType;
import lombok.Data;

import java.time.LocalDateTime;


@Data
public class PostDto {
    private Long id;
    private Long roomId;
    private Long userId;
    private String mediaUrl;
    private PostType type;
    private int likeCount;
    private int commentCount;
    private LocalDateTime createdAt;
    private String username;
    private String userAvatar;
}
