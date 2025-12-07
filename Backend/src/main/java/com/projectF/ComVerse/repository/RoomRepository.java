package com.projectF.ComVerse.repository;


import com.projectF.ComVerse.domain.entities.RoomEntity;
import com.projectF.ComVerse.domain.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<RoomEntity, Long> {

    List<RoomEntity> findByCommunity_Id(Long communityId);

    List<RoomEntity> findByCommunity_IdAndType(Long communityId, RoomType type);

}

