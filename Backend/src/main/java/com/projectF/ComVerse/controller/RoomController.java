package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.dtos.RoomDto;
import com.projectF.ComVerse.domain.dtos.RoomSettingsDto;
import com.projectF.ComVerse.domain.entities.RoomEntity;
import com.projectF.ComVerse.domain.enums.RoomType;
import com.projectF.ComVerse.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @PostMapping("/{communityId}")
    public RoomDto createRoom(
            @PathVariable Long communityId,
            @RequestBody RoomDto dto
    ) {
        return roomService.createRoom(communityId, dto);
    }

    @GetMapping("/community/{communityId}")
    public List<RoomDto> getCommunityRooms(@PathVariable Long communityId) {
        return roomService.getRoomsByCommunity(communityId);
    }

    @GetMapping("/community/{communityId}/type/{type}")
    public List<RoomDto> getRoomsByCommunityAndType(
            @PathVariable Long communityId,
            @PathVariable RoomType type
    ) {
        return roomService.getRoomsByCommunityAndType(communityId, type);
    }

    @PutMapping("/{roomId}/rename")
    public RoomDto renameRoom(
            @PathVariable Long roomId,
            @RequestParam String newName
    ) {
        return roomService.renameRoom(roomId, newName);
    }

    @DeleteMapping("/{roomId}")
    public void deleteRoom(@PathVariable Long roomId) {
        roomService.deleteRoom(roomId);
    }

    @PutMapping("/{roomId}/type")
    public RoomDto changeRoomType(
            @PathVariable Long roomId,
            @RequestParam RoomType type
    ) {
        return roomService.changeRoomType(roomId, type);
    }

    @PatchMapping("/{roomId}/settings")
    public RoomEntity updateSettings(
            @PathVariable Long roomId,
            @RequestParam Long actingUserId,
            @RequestBody RoomSettingsDto dto
    ) {
        return roomService.updateRoomSettings(actingUserId, roomId, dto);
    }

}
