package com.projectF.ComVerse.repository;

import com.projectF.ComVerse.domain.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    boolean existsByUsername(String username);
}
