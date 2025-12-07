package com.projectF.ComVerse.service;


import com.projectF.ComVerse.domain.dtos.DirectMessageDto;
import com.projectF.ComVerse.domain.entities.DirectMessageEntity;
import com.projectF.ComVerse.domain.entities.UserEntity;
import com.projectF.ComVerse.mapper.DirectMessageMapper;
import com.projectF.ComVerse.repository.DirectMessageRepository;
import com.projectF.ComVerse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DirectMessageService {

    @Autowired
    private DirectMessageRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DirectMessageMapper mapper;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public DirectMessageDto sendMessage(Long senderId, Long receiverId, String content) {

        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        UserEntity receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        DirectMessageEntity entity = DirectMessageEntity.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .createdAt(LocalDateTime.now())
                .read(false)
                .build();

        DirectMessageEntity saved = repository.save(entity);

        DirectMessageDto dto = mapper.toDto(saved);

        // Send to BOTH SIDES
        messagingTemplate.convertAndSend("/topic/dm/" + senderId + "/" + receiverId, dto);
        messagingTemplate.convertAndSend("/topic/dm/" + receiverId + "/" + senderId, dto);

        return dto;
    }

    public List<DirectMessageDto> getConversation(Long u1, Long u2) {
        return repository.getConversation(u1, u2)
                .stream()
                .map(mapper::toDto)
                .toList();
    }
}

