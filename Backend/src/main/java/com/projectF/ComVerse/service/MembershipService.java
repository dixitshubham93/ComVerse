package com.projectF.ComVerse.service;

import com.projectF.ComVerse.domain.dtos.MembershipDto;
import com.projectF.ComVerse.domain.entities.*;
import com.projectF.ComVerse.domain.enums.MembershipRole;
import com.projectF.ComVerse.mapper.MembershipMapper;
import com.projectF.ComVerse.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
@Service
public class MembershipService {

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommunityRepository communityRepository;

    @Autowired
    private MembershipMapper membershipMapper;

    public MembershipDto joinCommunity(Long userId, Long communityId) {

        if (membershipRepository.existsByUser_IdAndCommunity_Id(userId, communityId)) {
            throw new RuntimeException("Already joined");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CommunityEntity community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        MembershipEntity entity = MembershipEntity.builder()
                .user(user)
                .community(community)
                .role(MembershipRole.MEMBER)
                .joinedAt(LocalDateTime.now())
                .build();

        MembershipEntity saved = membershipRepository.save(entity);

        return membershipMapper.toDto(saved);
    }


    public void leaveCommunity(Long userId, Long communityId) {
        MembershipEntity membership = membershipRepository
                .findByUser_IdAndCommunity_Id(userId, communityId)
                .orElseThrow(() -> new RuntimeException("Membership does not exist"));

        // Prevent owner from leaving
        if (membership.getRole() == MembershipRole.OWNER) {
            throw new RuntimeException("Owner cannot leave the community. Transfer ownership first or delete the community.");
        }

        membershipRepository.delete(membership);
    }

    public List<MembershipDto> getUserMemberships(Long userId) {

        return membershipRepository.findByUser_Id(userId)
                .stream()
                .map(membershipMapper::toDto)
                .toList();
    }

    public MembershipDto setRole(Long actingUserId, Long targetUserId, Long communityId, MembershipRole newRole) {

        MembershipEntity acting = membershipRepository
                .findByUser_IdAndCommunity_Id(actingUserId, communityId)
                .orElseThrow(() -> new RuntimeException("Not a member"));

        if (acting.getRole() != MembershipRole.OWNER) {
            throw new RuntimeException("Only owner can change roles");
        }

        MembershipEntity target = membershipRepository
                .findByUser_IdAndCommunity_Id(targetUserId, communityId)
                .orElseThrow(() -> new RuntimeException("Target not a member"));

        if (target.getRole() == MembershipRole.OWNER) {
            throw new RuntimeException("Cannot modify owner role");
        }

        target.setRole(newRole);
        MembershipEntity updated = membershipRepository.save(target);

        return membershipMapper.toDto(updated);
    }


    public void kickMember(Long actingUserId, Long targetUserId, Long communityId) {

        MembershipEntity acting = membershipRepository
                .findByUser_IdAndCommunity_Id(actingUserId, communityId)
                .orElseThrow(() -> new RuntimeException("Not a member"));

        MembershipEntity target = membershipRepository
                .findByUser_IdAndCommunity_Id(targetUserId, communityId)
                .orElseThrow(() -> new RuntimeException("Target not a member"));

        if (acting.getRole() == MembershipRole.OWNER) {
            membershipRepository.delete(target);
            return;
        }

        if (acting.getRole() == MembershipRole.ADMIN) {

            if (target.getRole() == MembershipRole.OWNER) {
                throw new RuntimeException("Admins cannot remove the owner");
            }

            if (target.getRole() == MembershipRole.ADMIN) {
                throw new RuntimeException("Admins cannot remove another admin");
            }

            membershipRepository.delete(target);
            return;
        }

        throw new RuntimeException("Insufficient permission to kick members");
    }

    public void deleteCommunity(Long userId, Long communityId) {

        MembershipEntity acting = membershipRepository
                .findByUser_IdAndCommunity_Id(userId, communityId)
                .orElseThrow(() -> new RuntimeException("Not a member"));

        if (acting.getRole() != MembershipRole.OWNER) {
            throw new RuntimeException("Only owner can delete the community");
        }

        membershipRepository.deleteByCommunity_Id(communityId);
        communityRepository.deleteById(communityId);
    }

    public List<MembershipDto> getCommunityMembers(Long communityId) {

        return membershipRepository.findByCommunity_Id(communityId)
                .stream()
                .map(membershipMapper::toDto)
                .toList();
    }

    public boolean checkMembership(Long userId, Long communityId) {
        return membershipRepository.existsByUser_IdAndCommunity_Id(userId, communityId);
    }

    public MembershipRole getUserRole(Long userId, Long communityId) {
        return membershipRepository.findByUser_IdAndCommunity_Id(userId, communityId)
                .map(MembershipEntity::getRole)
                .orElse(null);
    }
}

