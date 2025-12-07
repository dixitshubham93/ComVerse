package com.projectF.ComVerse.repository;

import com.projectF.ComVerse.domain.entities.CommunityEntity;
import com.projectF.ComVerse.domain.enums.CommunityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommunityRepository extends JpaRepository<CommunityEntity, Long> {

    boolean existsByName(String name);

    List<CommunityEntity> findByType(CommunityType type);

    List<CommunityEntity> findByNameContainingIgnoreCase(String name);


}
