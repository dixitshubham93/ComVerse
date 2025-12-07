package com.projectF.ComVerse.mapper;

import com.projectF.ComVerse.domain.dtos.UserDto;
import com.projectF.ComVerse.domain.entities.UserEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    UserEntity toEntity(UserDto dto);

    UserDto toDto(UserEntity entity);
}
