package com.projectF.ComVerse.mapper;

import com.projectF.ComVerse.domain.dtos.DirectMessageDto;
import com.projectF.ComVerse.domain.entities.DirectMessageEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DirectMessageMapper {

    @Mapping(source = "sender.id", target = "senderId")
    @Mapping(source = "receiver.id", target = "receiverId")
    DirectMessageDto toDto(DirectMessageEntity entity);

    @Mapping(target = "sender", ignore = true)
    @Mapping(target = "receiver", ignore = true)
    DirectMessageEntity toEntity(DirectMessageDto dto);
}
