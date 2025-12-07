package com.projectF.ComVerse.domain.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommunityStatsDto {
    private int activeMembers;
    private int totalMembers;
}

