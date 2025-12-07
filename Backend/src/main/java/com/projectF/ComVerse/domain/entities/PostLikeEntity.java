package com.projectF.ComVerse.domain.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "post_likes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "user_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostLikeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private PostEntity post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
}
