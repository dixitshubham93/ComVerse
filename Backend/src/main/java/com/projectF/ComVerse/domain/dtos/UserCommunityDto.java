package com.projectF.ComVerse.domain.dtos;

import com.projectF.ComVerse.domain.enums.CommunityType;
import com.projectF.ComVerse.domain.enums.MembershipRole;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCommunityDto {
    private Long id;
    private String name;
    private String description;
    private String bannerUrl;
    private CommunityType type;
    private Long memberCount;
    private MembershipRole userRole;
}

