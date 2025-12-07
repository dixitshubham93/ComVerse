package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.dtos.CommunityDto;
import com.projectF.ComVerse.domain.dtos.PostDto;
import com.projectF.ComVerse.domain.dtos.UserDto;
import com.projectF.ComVerse.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public UserDto createUser(@RequestBody UserDto dto) {
        return userService.createUser(dto);
    }

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @GetMapping("/{id}/communities")
    public List<CommunityDto> getUserCommunities(@PathVariable Long id) {
        return userService.getUserCommunities(id);
    }

    @GetMapping("/{id}/communities/details")
    public List<com.projectF.ComVerse.domain.dtos.UserCommunityDto> getUserCommunitiesWithDetails(@PathVariable Long id) {
        return userService.getUserCommunitiesWithDetails(id);
    }

    @GetMapping("/{id}/posts")
    public List<PostDto> getUserPosts(@PathVariable Long id) {
        return userService.getUserPosts(id);
    }

    @GetMapping("/{id}/recent-posts")
    public List<PostDto> getUserRecentPosts(@PathVariable Long id) {
        return userService.getUserRecentPosts(id);
    }

    @PatchMapping("/{id}/avatar")
    public UserDto updateAvatar(
            @PathVariable Long id,
            @RequestParam String avatarUrl
    ) {
        return userService.updateAvatar(id, avatarUrl);
    }

}
