package com.projectF.ComVerse.repository;

import com.projectF.ComVerse.domain.entities.DirectMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessageEntity, Long> {

    // Fetch conversation between two users
    @Query("""
        SELECT m FROM DirectMessageEntity m 
        WHERE (m.sender.id = :u1 AND m.receiver.id = :u2)
           OR (m.sender.id = :u2 AND m.receiver.id = :u1)
        ORDER BY m.createdAt ASC
    """)
    List<DirectMessageEntity> getConversation(Long u1, Long u2);
}

