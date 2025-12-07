package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.dtos.MessageDto;
import com.projectF.ComVerse.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatRestController {

    @Autowired
    private ChatService chatService;

    @GetMapping("/rooms/{roomId}/messages")
    public Page<MessageDto> getRoomMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return chatService.getMessages(roomId, page, size);
    }
}
