package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.dtos.CommunityDto;
import com.projectF.ComVerse.domain.dtos.CommunityStatsDto;
import com.projectF.ComVerse.domain.dtos.UpdateCommunityDto;
import com.projectF.ComVerse.domain.enums.CommunityType;
import com.projectF.ComVerse.service.CommunityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communities")
public class CommunityController {

    @Autowired
    private CommunityService communityService;

    @PostMapping
    public CommunityDto createCommunity(
            @RequestBody CommunityDto dto,
            @RequestParam Long creatorUserId
    ) {
        return communityService.createCommunity(dto, creatorUserId);
    }


            @GetMapping("/{id}")
    public CommunityDto getCommunity(@PathVariable Long id) {
        return communityService.getCommunityById(id);
    }

    @GetMapping
    public List<CommunityDto> getAll() {
        return communityService.getAllCommunities();
    }

    @GetMapping("/type/{type}")
    public List<CommunityDto> getByType(@PathVariable CommunityType type) {
        return communityService.getCommunitiesByType(type);
    }

    @GetMapping("/search")
    public List<CommunityDto> search(@RequestParam String query) {
        return communityService.search(query);
    }

    @PatchMapping("/{communityId}")
    public CommunityDto updateCommunity(
            @PathVariable Long communityId,
            @RequestParam Long actingUserId,
            @RequestBody UpdateCommunityDto dto
    ) {
        return communityService.updateCommunity(actingUserId, communityId, dto);
    }

    @GetMapping("/{id}/member-count")
    public Integer getMemberCount(@PathVariable Long id) {
        return communityService.getCommunityMemberCount(id);
    }

    @GetMapping("/{id}/stats")
    public CommunityStatsDto getCommunityStats(@PathVariable Long id) {
        return communityService.getCommunityStats(id);
    }

}
