package com.projectF.ComVerse.service;

import com.projectF.ComVerse.domain.dtos.CommunityDto;
import com.projectF.ComVerse.domain.dtos.CommunityStatsDto;
import com.projectF.ComVerse.domain.dtos.UpdateCommunityDto;
import com.projectF.ComVerse.domain.entities.CommunityEntity;
import com.projectF.ComVerse.domain.entities.MembershipEntity;
import com.projectF.ComVerse.domain.entities.RoomEntity;
import com.projectF.ComVerse.domain.entities.UserEntity;
import com.projectF.ComVerse.domain.enums.CommunityType;
import com.projectF.ComVerse.domain.enums.MembershipRole;
import com.projectF.ComVerse.domain.enums.RoomType;
import com.projectF.ComVerse.mapper.CommunityMapper;
import com.projectF.ComVerse.repository.CommunityRepository;
import com.projectF.ComVerse.repository.MembershipRepository;
import com.projectF.ComVerse.repository.RoomRepository;
import com.projectF.ComVerse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommunityService {

    @Autowired
    private CommunityRepository communityRepository;

    @Autowired
    private CommunityMapper communityMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private RoomRepository roomRepository;


    public CommunityDto createCommunity(CommunityDto dto, Long creatorUserId) {

        if (communityRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Community name already exists");
        }

        CommunityEntity entity = communityMapper.toEntity(dto);
        CommunityEntity saved = communityRepository.save(entity);

        UserEntity creator = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MembershipEntity membership = MembershipEntity.builder()
                .user(creator)
                .community(saved)
                .role(MembershipRole.OWNER)
                .joinedAt(LocalDateTime.now())
                .build();

        membershipRepository.save(membership);

        RoomEntity generalRoom = RoomEntity.builder()
                .community(saved)
                .name("general")
                .type(RoomType.CHAT)
                .isDefaultRoom(true)
                .readOnly(false)
                .adminOnly(false)
                .locked(false)
                .createdAt(LocalDateTime.now())
                .build();

        roomRepository.save(generalRoom);
        RoomEntity announcementsRoom = RoomEntity.builder()
                .community(saved)
                .name("announcements")
                .type(RoomType.CHAT)
                .isDefaultRoom(false)
                .readOnly(true)
                .adminOnly(true)
                .locked(false)
                .createdAt(LocalDateTime.now())
                .build();

        roomRepository.save(announcementsRoom);

        return communityMapper.toDto(saved);
    }

    public CommunityDto getCommunityById(Long id) {
        CommunityEntity entity = communityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Community not found"));
        return communityMapper.toDto(entity);
    }

    public List<CommunityDto> getAllCommunities() {
        return communityRepository.findAll()
                .stream()
                .map(communityMapper::toDto)
                .toList();
    }

    public List<CommunityDto> getCommunitiesByType(CommunityType type) {
        return communityRepository.findByType(type)
                .stream()
                .map(communityMapper::toDto)
                .toList();
    }

    public List<CommunityDto> search(String query) {
        return communityRepository.findByNameContainingIgnoreCase(query)
                .stream()
                .map(communityMapper::toDto)
                .toList();
    }

    public CommunityDto updateCommunity(Long actingUserId, Long communityId, UpdateCommunityDto dto) {

        MembershipEntity membership = membershipRepository
                .findByUser_IdAndCommunity_Id(actingUserId, communityId)
                .orElseThrow(() -> new RuntimeException("You are not a member of this community"));

        MembershipRole role = membership.getRole();

        CommunityEntity community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        if (dto.getName() != null && !dto.getName().equals(community.getName())) {

            if (role != MembershipRole.OWNER) {
                throw new RuntimeException("Only the owner can change the community name");
            }

            if (communityRepository.existsByName(dto.getName())) {
                throw new RuntimeException("Community name already exists");
            }

            community.setName(dto.getName());
        }

        if (role == MembershipRole.OWNER || role == MembershipRole.ADMIN) {

            if (dto.getDescription() != null)
                community.setDescription(dto.getDescription());

            if (dto.getBannerUrl() != null)
                community.setBannerUrl(dto.getBannerUrl());

            if (dto.getType() != null)
                community.setType(dto.getType());

        } else {
            throw new RuntimeException("You do not have permission to update this community");
        }
        CommunityEntity updated = communityRepository.save(community);
        return communityMapper.toDto(updated);
    }

    public int getCommunityMemberCount(Long communityId) {
        return membershipRepository.findByCommunity_Id(communityId).size();
    }

    public CommunityStatsDto getCommunityStats(Long communityId) {
        List<MembershipEntity> members = membershipRepository.findByCommunity_Id(communityId);
        int totalMembers = members.size();
        
        // Placeholder: Consider members active if they joined in last 30 days
        // In production, this would check actual activity (e.g., last login, last message)
        long activeMembers = members.stream()
                .filter(m -> m.getJoinedAt().isAfter(LocalDateTime.now().minusDays(30)))
                .count();
        
        // If no active members by date, at least show total members as active
        int activeCount = totalMembers > 0 && activeMembers == 0 ? totalMembers : (int) activeMembers;
        
        return new CommunityStatsDto(activeCount, totalMembers);
    }
}
