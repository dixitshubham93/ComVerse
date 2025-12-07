package com.projectF.ComVerse.controller;


import com.projectF.ComVerse.domain.dtos.DirectMessageDto;
import com.projectF.ComVerse.service.DirectMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dm")
public class DirectMessageRestController {

    @Autowired
    private DirectMessageService dmService;

    @GetMapping("/{user1}/{user2}")
    public  List<DirectMessageDto> getConversation(
            @PathVariable Long user1,
            @PathVariable Long user2
    ) {
        return dmService.getConversation(user1, user2);
    }
}
