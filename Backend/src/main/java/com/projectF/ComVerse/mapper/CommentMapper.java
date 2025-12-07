package com.projectF.ComVerse.mapper;

import com.projectF.ComVerse.domain.dtos.CommentDto;
import com.projectF.ComVerse.domain.entities.CommentEntity;
import org.mapstruct.InheritInverseConfiguration;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(source = "post.id", target = "postId")
    @Mapping(source = "user.id", target = "userId")
    CommentDto toDto(CommentEntity entity);

    @InheritInverseConfiguration
    CommentEntity toEntity(CommentDto dto);
}
