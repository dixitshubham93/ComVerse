package com.projectF.ComVerse.domain.dtos;

import com.projectF.ComVerse.domain.enums.CommunityType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityDto {

    private Long id;
    private String name;
    private String description;
    private String bannerUrl;
    private CommunityType type;
}
