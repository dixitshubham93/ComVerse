package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.entities.MembershipEntity;
import com.projectF.ComVerse.domain.entities.RoomEntity;
import com.projectF.ComVerse.domain.enums.MembershipRole;
import com.projectF.ComVerse.repository.MembershipRepository;
import com.projectF.ComVerse.repository.RoomRepository;
import com.projectF.ComVerse.service.ChatService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
public class ChatStompController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @MessageMapping("/rooms/{roomId}/send")
    public void sendMessage(
            @DestinationVariable Long roomId,
            ChatIncomingPayload message
    ) {

        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (room.isLocked()) {
            throw new MessagingException("Channel is locked");
        }
        if (room.isReadOnly() || room.isAdminOnly()) {

            Long communityId = room.getCommunity().getId();

            MembershipEntity membership = membershipRepository
                    .findByUser_IdAndCommunity_Id(message.getUserId(), communityId)
                    .orElseThrow(() -> new RuntimeException("Not a community member"));

            boolean isAdmin =
                    membership.getRole() == MembershipRole.ADMIN ||
                            membership.getRole() == MembershipRole.OWNER;

            if (!isAdmin) {
                throw new MessagingException("You do not have permission to send messages in this room");
            }
        }
        chatService.handleIncomingMessage(
                roomId,
                message.getUserId(),
                message.getContent(),
                message.getContentType()
        );
    }

    @Data
    public static class ChatIncomingPayload {
        private Long userId;
        private String content;
        private String contentType;
    }
}
