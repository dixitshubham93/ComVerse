package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.service.PresenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    @Autowired
    private PresenceService presenceService;

    @GetMapping("/{userId}")
    public boolean isOnline(@PathVariable Long userId) {
        return presenceService.isOnline(userId);
    }

    @GetMapping("/all")
    public Set<Long> getOnlineUsers() {
        return presenceService.getOnlineUsersList();
    }

    @GetMapping("/count")
    public int getOnlineCount() {
        return presenceService.getTotalOnlineUsers();
    }
}

