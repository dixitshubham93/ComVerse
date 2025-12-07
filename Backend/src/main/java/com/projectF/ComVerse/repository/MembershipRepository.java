package com.projectF.ComVerse.repository;

import com.projectF.ComVerse.domain.entities.MembershipEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<MembershipEntity, Long> {

    List<MembershipEntity> findByUser_Id(Long userId);

    Optional<MembershipEntity> findByUser_IdAndCommunity_Id(Long userId, Long communityId);

    boolean existsByUser_IdAndCommunity_Id(Long userId, Long communityId);

    void deleteByCommunity_Id(Long communityId);

    List<MembershipEntity> findByCommunity_Id(Long communityId);
}

