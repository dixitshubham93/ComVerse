package com.projectF.ComVerse.service;


import com.projectF.ComVerse.domain.dtos.PostDto;
import com.projectF.ComVerse.domain.dtos.UserProfileDto;
import com.projectF.ComVerse.domain.entities.UserEntity;
import com.projectF.ComVerse.domain.enums.MembershipRole;
import com.projectF.ComVerse.mapper.CommunityMapper;
import com.projectF.ComVerse.mapper.PostMapper;
import com.projectF.ComVerse.repository.CommunityRepository;
import com.projectF.ComVerse.repository.MembershipRepository;
import com.projectF.ComVerse.repository.PostRepository;
import com.projectF.ComVerse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private CommunityRepository communityRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommunityMapper communityMapper;

    @Autowired
    private PostMapper postMapper;

    public UserProfileDto getProfile(Long userId) {

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        var joined = membershipRepository.findByUser_Id(userId)
                .stream()
                .map(m -> communityMapper.toDto(m.getCommunity()))
                .toList();

        var created = membershipRepository
                .findByUser_Id(userId)
                .stream()
                .filter(m -> m.getRole() == MembershipRole.OWNER)
                .map(m -> communityMapper.toDto(m.getCommunity()))
                .toList();

        List<PostDto> posts = postRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(postMapper::toDto)
                .toList();

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .bannerUrl(user.getBannerUrl())
                .age(user.getAge())
                .communitiesJoined(joined)
                .communitiesCreated(created)
                .posts(posts)
                .build();
    }
}

