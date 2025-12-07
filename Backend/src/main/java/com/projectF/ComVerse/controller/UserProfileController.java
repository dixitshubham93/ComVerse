package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.dtos.UserProfileDto;
import com.projectF.ComVerse.service.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    @Autowired
    private UserProfileService profileService;

    @GetMapping("/{userId}/profile")
    public UserProfileDto getProfile(@PathVariable Long userId) {
        return profileService.getProfile(userId);
    }
}
