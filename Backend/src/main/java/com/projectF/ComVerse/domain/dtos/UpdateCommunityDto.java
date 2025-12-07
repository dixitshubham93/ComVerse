package com.projectF.ComVerse.domain.dtos;

import com.projectF.ComVerse.domain.enums.CommunityType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCommunityDto {

    private String name;          // Only owner can change
    private String description;
    private String bannerUrl;
    private CommunityType type;
}
