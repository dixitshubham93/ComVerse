package com.projectF.ComVerse.domain.dtos;


import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserProfileDto {
    private Long id;
    private String username;
    private String avatarUrl;
    private String bannerUrl;
    private Integer age;

    private List<CommunityDto> communitiesJoined;
    private List<CommunityDto> communitiesCreated;
    private List<PostDto> posts;
}
