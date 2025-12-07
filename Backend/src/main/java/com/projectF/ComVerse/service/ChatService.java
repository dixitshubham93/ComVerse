package com.projectF.ComVerse.service;

import com.projectF.ComVerse.domain.dtos.MessageDto;
import com.projectF.ComVerse.domain.entities.*;
import com.projectF.ComVerse.mapper.MessageMapper;
import com.projectF.ComVerse.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ChatService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageMapper messageMapper;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void handleIncomingMessage(Long roomId, Long userId, String content, String contentType) {

        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MessageEntity entity = MessageEntity.builder()
                .room(room)
                .user(user)
                .content(content)
                .contentType(contentType == null ? "TEXT" : contentType)
                .createdAt(LocalDateTime.now())
                .build();

        MessageEntity saved = messageRepository.save(entity);

        MessageDto dto = messageMapper.toDto(saved);

        // Broadcast to /topic/rooms/{roomId}
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, dto);

    }

    /**
     * Get message history (paged, latest first).
     */
    public Page<MessageDto> getMessages(Long roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MessageEntity> pageEntity = messageRepository.findByRoom_IdOrderByCreatedAtDesc(roomId, pageable);
        return pageEntity.map(messageMapper::toDto);
    }
}
