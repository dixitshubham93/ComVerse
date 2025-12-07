package com.projectF.ComVerse.mapper;

import com.projectF.ComVerse.domain.dtos.MembershipDto;
import com.projectF.ComVerse.domain.entities.MembershipEntity;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface MembershipMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "community.id", target = "communityId")
    MembershipDto toDto(MembershipEntity entity);
}
