package com.projectF.ComVerse.service;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.projectF.ComVerse.domain.dtos.CreatePostRequest;
import com.projectF.ComVerse.domain.dtos.PostDto;
import com.projectF.ComVerse.domain.entities.PostEntity;
import com.projectF.ComVerse.domain.entities.PostLikeEntity;
import com.projectF.ComVerse.domain.entities.RoomEntity;
import com.projectF.ComVerse.domain.entities.UserEntity;
import com.projectF.ComVerse.mapper.PostMapper;
import com.projectF.ComVerse.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.Map;


@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private PostLikeRepository likeRepository;

    @Autowired
    private PostMapper postMapper;

    @Autowired
    private Cloudinary cloudinary;

    public PostDto createPost(CreatePostRequest request) {

        RoomEntity room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Long communityId = room.getCommunity().getId();

        if (!membershipRepository.existsByUser_IdAndCommunity_Id(request.getUserId(), communityId)) {
            throw new RuntimeException("Not a community member");
        }

        UserEntity user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        MultipartFile media = request.getMedia();
        if (media == null || media.isEmpty()) {
            throw new RuntimeException("Media file is required");
        }

        String mediaUrl;
        try {
            Map upload = cloudinary.uploader().upload(
                    media.getBytes(),
                    ObjectUtils.asMap("resource_type", "auto")
            );
            mediaUrl = upload.get("secure_url").toString();

        } catch (Exception e) {
            throw new RuntimeException("Upload failed: " + e.getMessage());
        }

        PostEntity post = PostEntity.builder()
                .room(room)
                .user(user)
                .mediaUrl(mediaUrl)
                .type(request.getType()) // IMAGE or VIDEO
                .createdAt(LocalDateTime.now())
                .build();

        return postMapper.toDto(postRepository.save(post));
    }


    public Page<PostDto> getRoomPosts(Long roomId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostEntity> posts = postRepository.findByRoom_IdOrderByCreatedAtDesc(roomId, pageable);
        return posts.map(postMapper::toDto);
    }


    public int toggleLike(Long userId, Long postId) {

        if (likeRepository.existsByPost_IdAndUser_Id(postId, userId)) {
            likeRepository.deleteByPost_IdAndUser_Id(postId, userId);
        } else {
            PostEntity post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            likeRepository.save(PostLikeEntity.builder()
                    .post(post)
                    .user(user)
                    .build());
        }

        return likeRepository.countByPost_Id(postId);
    }
}
