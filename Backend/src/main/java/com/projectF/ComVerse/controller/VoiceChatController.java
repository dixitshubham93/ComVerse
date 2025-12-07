package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.entities.MembershipEntity;
import com.projectF.ComVerse.domain.entities.RoomEntity;
import com.projectF.ComVerse.domain.enums.MembershipRole;
import com.projectF.ComVerse.domain.enums.RoomType;
import com.projectF.ComVerse.repository.MembershipRepository;
import com.projectF.ComVerse.repository.RoomRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class VoiceChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    // USER JOINS VC ROOM
    @MessageMapping("/vc/{roomId}/join")
    public void joinVC(@DestinationVariable Long roomId, VCPayload payload) {

        RoomEntity room = validateVoiceRoom(roomId);

        validateMembership(room, payload.getUserId());

        // Notify others that this user joined
        messagingTemplate.convertAndSend(
                "/topic/vc/" + roomId + "/join",
                payload
        );
    }

    // USER LEAVES VC ROOM
    @MessageMapping("/vc/{roomId}/leave")
    public void leaveVC(@DestinationVariable Long roomId, VCPayload payload) {

        RoomEntity room = validateVoiceRoom(roomId);

        validateMembership(room, payload.getUserId());

        messagingTemplate.convertAndSend(
                "/topic/vc/" + roomId + "/leave",
                payload
        );
    }

    // WEBRTC OFFER
    @MessageMapping("/vc/{roomId}/offer")
    public void offer(@DestinationVariable Long roomId, VCPayload payload) {
        RoomEntity room = validateVoiceRoom(roomId);

        validateMembership(room, payload.getUserId());

        messagingTemplate.convertAndSend(
                "/topic/vc/" + roomId + "/offer",
                payload
        );
    }

    // WEBRTC ANSWER
    @MessageMapping("/vc/{roomId}/answer")
    public void answer(@DestinationVariable Long roomId, VCPayload payload) {
        RoomEntity room = validateVoiceRoom(roomId);

        validateMembership(room, payload.getUserId());

        messagingTemplate.convertAndSend(
                "/topic/vc/" + roomId + "/answer",
                payload
        );
    }

    // ICE CANDIDATE
    @MessageMapping("/vc/{roomId}/ice")
    public void iceCandidate(@DestinationVariable Long roomId, VCPayload payload) {
        RoomEntity room = validateVoiceRoom(roomId);

        validateMembership(room, payload.getUserId());

        messagingTemplate.convertAndSend(
                "/topic/vc/" + roomId + "/ice",
                payload
        );
    }

    // MUTE / UNMUTE (Admin Only)
    @MessageMapping("/vc/{roomId}/mute")
    public void mute(@DestinationVariable Long roomId, VCPayload payload) {

        RoomEntity room = validateVoiceRoom(roomId);

        MembershipEntity acting = validateMembership(room, payload.getFromUserId());

        // Only admin or owner can mute others
        if (acting.getRole() == MembershipRole.MEMBER) {
            throw new MessagingException("Only admins and owners can mute users.");
        }

        messagingTemplate.convertAndSend(
                "/topic/vc/" + roomId + "/mute",
                payload
        );
    }

    private RoomEntity validateVoiceRoom(Long roomId) {
        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new MessagingException("Room not found"));

        if (room.getType() != RoomType.VOICE_CHAT) {
            throw new MessagingException("This is not a voice chat room");
        }

        return room;
    }

    private MembershipEntity validateMembership(RoomEntity room, Long userId) {
        Long communityId = room.getCommunity().getId();

        return membershipRepository
                .findByUser_IdAndCommunity_Id(userId, communityId)
                .orElseThrow(() -> new MessagingException("You are not a member of this community"));
    }

    @Data
    public static class VCPayload {
        private Long userId;
        private Long fromUserId;   // used for mute events
        private Long targetUserId; // who is being muted
        private Object data;       // offer/answer/ice/mute
        private String type;       // "offer", "answer", "ice", "mute"
    }
}
