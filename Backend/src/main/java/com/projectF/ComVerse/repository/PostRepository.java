package com.projectF.ComVerse.repository;

import com.projectF.ComVerse.domain.entities.PostEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;


@Repository
public interface PostRepository extends JpaRepository<PostEntity, Long> {

    Page<PostEntity> findByRoom_IdOrderByCreatedAtDesc(Long roomId, Pageable pageable);

    List<PostEntity> findByUser_Id(Long userId);

    List<PostEntity> findByUser_IdOrderByCreatedAtDesc(Long userId);



}
