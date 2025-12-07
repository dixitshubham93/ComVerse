package com.projectF.ComVerse.domain.entities;

import com.projectF.ComVerse.domain.enums.MembershipRole;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "memberships",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "community_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    // User side
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // Community side
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id", nullable = false)
    private CommunityEntity community;

    @Enumerated(EnumType.STRING)
    private MembershipRole role;

    private LocalDateTime joinedAt;
}
