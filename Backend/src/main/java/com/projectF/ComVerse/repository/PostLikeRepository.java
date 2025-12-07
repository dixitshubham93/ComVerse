package com.projectF.ComVerse.repository;


import com.projectF.ComVerse.domain.entities.PostLikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLikeEntity, Long> {

    boolean existsByPost_IdAndUser_Id(Long postId, Long userId);

    void deleteByPost_IdAndUser_Id(Long postId, Long userId);

    int countByPost_Id(Long postId);
}
