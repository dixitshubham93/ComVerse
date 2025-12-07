package com.projectF.ComVerse.domain.dtos;

import com.projectF.ComVerse.domain.enums.RoomType;
import lombok.Data;

@Data
public class RoomSettingsDto {
    private String name;
    private RoomType type;
    private Boolean readOnly;
    private Boolean adminOnly;
    private Boolean locked;
}
