package com.projectF.ComVerse.mapper;

import com.projectF.ComVerse.domain.dtos.CommunityDto;
import com.projectF.ComVerse.domain.entities.CommunityEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CommunityMapper {

    CommunityEntity toEntity(CommunityDto dto);

    CommunityDto toDto(CommunityEntity entity);
}
