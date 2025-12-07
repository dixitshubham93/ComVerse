package com.projectF.ComVerse.repository;

import com.projectF.ComVerse.domain.entities.MessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    Page<MessageEntity> findByRoom_IdOrderByCreatedAtDesc(Long roomId, Pageable pageable);

}
