package com.projectF.ComVerse.mapper;

import com.projectF.ComVerse.domain.dtos.PostDto;
import com.projectF.ComVerse.domain.entities.PostEntity;
import jakarta.validation.constraints.NotNull;
import org.mapstruct.InheritInverseConfiguration;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface PostMapper {

    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "user.avatarUrl", target = "userAvatar")
    @Mapping(target = "likeCount", expression = "java(entity.getLikes().size())")
    @Mapping(target = "commentCount", expression = "java(entity.getComments().size())")
    PostDto toDto(PostEntity entity);

    @InheritInverseConfiguration
    PostEntity toEntity(PostDto dto);
}
