package com.projectF.ComVerse.mapper;

import com.projectF.ComVerse.domain.dtos.MessageDto;
import com.projectF.ComVerse.domain.entities.MessageEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MessageMapper {

    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.username", target = "username")
    MessageDto toDto(MessageEntity entity);

}
