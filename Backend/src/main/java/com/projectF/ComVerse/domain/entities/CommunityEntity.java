package com.projectF.ComVerse.domain.entities;

import com.projectF.ComVerse.domain.enums.CommunityType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "communities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String bannerUrl;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CommunityType type;


}
