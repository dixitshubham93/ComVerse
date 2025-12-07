package com.projectF.ComVerse.domain.entities;

import com.projectF.ComVerse.domain.enums.RoomType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id", nullable = false)
    private CommunityEntity community;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private RoomType type;

    @Column(columnDefinition = "TEXT")
    private String config;

    private boolean isDefaultRoom;

    private LocalDateTime createdAt;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean readOnly = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean adminOnly = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean locked = false;


}
