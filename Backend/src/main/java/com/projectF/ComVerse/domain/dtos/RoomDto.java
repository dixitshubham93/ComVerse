package com.projectF.ComVerse.domain.dtos;

import com.projectF.ComVerse.domain.enums.RoomType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomDto {
    private Long id;
    private Long communityId;
    private String name;
    private RoomType type;
    private String config;
    private boolean isDefaultRoom;
}
