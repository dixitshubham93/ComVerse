package com.projectF.ComVerse.controller;


import com.projectF.ComVerse.service.DirectMessageService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
public class DirectMessageStompController {

    @Autowired
    private DirectMessageService dmService;

    @MessageMapping("/dm/{receiverId}/send")
    public void sendDM(
            @DestinationVariable Long receiverId,
            DMIncomingPayload payload
    ) {
        dmService.sendMessage(
                payload.getSenderId(),
                receiverId,
                payload.getContent()
        );
    }

    @Data
    public static class DMIncomingPayload {
        private Long senderId;
        private String content;
    }
}
