package com.projectF.ComVerse.repository;


import com.projectF.ComVerse.domain.entities.CommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    List<CommentEntity> findByPostIdOrderByCreatedAtAsc(Long postId);
}
