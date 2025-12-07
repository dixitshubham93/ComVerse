package com.projectF.ComVerse.domain.dtos;

import com.projectF.ComVerse.domain.enums.MembershipRole;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipDto {

    private Long id;
    private Long userId;
    private Long communityId;
    private MembershipRole role;
    private String joinedAt;
}
