package com.projectF.ComVerse.domain.entities;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "direct_messages")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class DirectMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private UserEntity sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private UserEntity receiver;

    private String content;

    private LocalDateTime createdAt;

    private boolean read; // read receipt support
}
