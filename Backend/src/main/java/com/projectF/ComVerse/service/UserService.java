package com.projectF.ComVerse.service;

import com.projectF.ComVerse.domain.dtos.*;
import com.projectF.ComVerse.domain.entities.UserEntity;
import com.projectF.ComVerse.mapper.CommunityMapper;
import com.projectF.ComVerse.mapper.PostMapper;
import com.projectF.ComVerse.repository.MembershipRepository;
import com.projectF.ComVerse.repository.PostRepository;
import com.projectF.ComVerse.repository.UserRepository;
import com.projectF.ComVerse.service.CommunityService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    @SuppressWarnings("unused")
    private PostRepository postRepository;

    @Autowired
    private com.projectF.ComVerse.mapper.UserMapper userMapper;

    @Autowired
    private CommunityMapper communityMapper;

    @Autowired
    @SuppressWarnings("unused")
    private PostMapper postMapper;

    @Autowired
    private CommunityService communityService;

    public UserDto createUser(UserDto dto) {
        // Check for duplicate email
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Check for duplicate username
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        UserEntity entity = userMapper.toEntity(dto);
        UserEntity saved = userRepository.save(entity);
        return userMapper.toDto(saved);
    }

    public UserDto createUserFromSignupRequest(SignupRequest request) {
        // Check for duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Check for duplicate username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        UserDto dto = UserDto.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(request.getPassword()) // TODO: Hash password
                .avatarUrl(request.getAvatarUrl())
                .bannerUrl(request.getBannerUrl())
                .age(request.getAge())
                .build();

        return createUser(dto);
    }

    public UserDto authenticateUser(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // TODO: Implement proper password hashing and verification
        // For now, simple comparison (NOT SECURE - MUST BE FIXED)
        if (user.getPassword() == null || !user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return userMapper.toDto(user);
    }

    public UserDto getUserById(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return userMapper.toDto(user);
    }

    public List<CommunityDto> getUserCommunities(Long userId) {
        return membershipRepository.findByUser_Id(userId)
                .stream()
                .map(m -> communityMapper.toDto(m.getCommunity()))
                .toList();
    }

    public List<UserCommunityDto> getUserCommunitiesWithDetails(Long userId) {
        return membershipRepository.findByUser_Id(userId)
                .stream()
                .map(membership -> {
                    var community = membership.getCommunity();
                    Long memberCount = (long) communityService.getCommunityMemberCount(community.getId());
                    
                    return UserCommunityDto.builder()
                            .id(community.getId())
                            .name(community.getName())
                            .description(community.getDescription())
                            .bannerUrl(community.getBannerUrl())
                            .type(community.getType())
                            .memberCount(memberCount)
                            .userRole(membership.getRole())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<PostDto> getUserPosts(Long userId) {
        // Placeholder: return empty list for now
        return Collections.emptyList();
    }

    public List<PostDto> getUserRecentPosts(Long userId) {
        // Placeholder: return empty list for now
        return Collections.emptyList();
    }

    public UserDto updateAvatar(Long id, String avatarUrl) {

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAvatarUrl(avatarUrl);

        UserEntity updated = userRepository.save(user);

        return userMapper.toDto(updated);
    }

}
