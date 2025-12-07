package com.projectF.ComVerse.mapper;

import com.projectF.ComVerse.domain.dtos.RoomDto;
import com.projectF.ComVerse.domain.entities.RoomEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoomMapper {

    @Mapping(source = "community.id", target = "communityId")
    RoomDto toDto(RoomEntity entity);

    @Mapping(source = "communityId", target = "community.id")
    RoomEntity toEntity(RoomDto dto);
}
