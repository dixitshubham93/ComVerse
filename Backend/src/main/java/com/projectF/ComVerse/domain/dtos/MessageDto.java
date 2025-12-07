package com.projectF.ComVerse.domain.dtos;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDto {
    private Long id;
    private Long roomId;
    private Long userId;
    private String username;
    private String content;
    private String contentType;
    private LocalDateTime createdAt;
}
