package com.projectF.ComVerse.service;


import com.projectF.ComVerse.domain.dtos.RoomDto;
import com.projectF.ComVerse.domain.dtos.RoomSettingsDto;
import com.projectF.ComVerse.domain.entities.CommunityEntity;
import com.projectF.ComVerse.domain.entities.MembershipEntity;
import com.projectF.ComVerse.domain.entities.RoomEntity;
import com.projectF.ComVerse.domain.enums.MembershipRole;
import com.projectF.ComVerse.domain.enums.RoomType;
import com.projectF.ComVerse.mapper.RoomMapper;
import com.projectF.ComVerse.repository.CommunityRepository;
import com.projectF.ComVerse.repository.MembershipRepository;
import com.projectF.ComVerse.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private CommunityRepository communityRepository;

    @Autowired
    private RoomMapper roomMapper;

    @Autowired
    private MembershipRepository membershipRepository;

    public RoomDto createRoom(Long communityId, RoomDto dto) {

        CommunityEntity community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        RoomEntity room = RoomEntity.builder()
                .community(community)
                .name(dto.getName())
                .type(dto.getType())
                .config(dto.getConfig())
                .isDefaultRoom(dto.isDefaultRoom())
                .createdAt(LocalDateTime.now())
                .build();

        RoomEntity saved = roomRepository.save(room);
        return roomMapper.toDto(saved);
    }

    public List<RoomDto> getRoomsByCommunity(Long communityId) {
        return roomRepository.findByCommunity_Id(communityId)
                .stream()
                .map(roomMapper::toDto)
                .toList();
    }

    public List<RoomDto> getRoomsByCommunityAndType(Long communityId, RoomType type) {
        return roomRepository.findByCommunity_IdAndType(communityId, type)
                .stream()
                .map(roomMapper::toDto)
                .toList();
    }

    public RoomDto renameRoom(Long roomId, String newName) {
        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        room.setName(newName);
        roomRepository.save(room);

        return roomMapper.toDto(room);
    }

    public void deleteRoom(Long roomId) {
        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (room.isDefaultRoom()) {
            throw new RuntimeException("Default rooms cannot be deleted");
        }

        roomRepository.delete(room);
    }

    public RoomDto changeRoomType(Long roomId, RoomType type) {
        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        room.setType(type);
        roomRepository.save(room);

        return roomMapper.toDto(room);
    }

    public RoomEntity updateRoomSettings(Long actingUserId, Long roomId, RoomSettingsDto dto) {

        RoomEntity room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Long communityId = room.getCommunity().getId();

        MembershipEntity membership = membershipRepository
                .findByUser_IdAndCommunity_Id(actingUserId, communityId)
                .orElseThrow(() -> new RuntimeException("Not a community member"));

        if (membership.getRole() == MembershipRole.MEMBER) {
            throw new RuntimeException("Only admins or owner can update room settings");
        }

        if (dto.getName() != null)
            room.setName(dto.getName());

        if (dto.getType() != null)
            room.setType(dto.getType());

        if (dto.getReadOnly() != null)
            room.setReadOnly(dto.getReadOnly());

        if (dto.getAdminOnly() != null)
            room.setAdminOnly(dto.getAdminOnly());

        if (dto.getLocked() != null)
            room.setLocked(dto.getLocked());

        return roomRepository.save(room);
    }
}


