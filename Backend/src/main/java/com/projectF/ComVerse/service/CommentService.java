package com.projectF.ComVerse.service;

import com.projectF.ComVerse.domain.dtos.CommentDto;
import com.projectF.ComVerse.domain.dtos.CreateCommentRequest;
import com.projectF.ComVerse.domain.entities.CommentEntity;
import com.projectF.ComVerse.domain.entities.PostEntity;
import com.projectF.ComVerse.domain.entities.UserEntity;
import com.projectF.ComVerse.mapper.CommentMapper;
import com.projectF.ComVerse.repository.CommentRepository;
import com.projectF.ComVerse.repository.MembershipRepository;
import com.projectF.ComVerse.repository.PostRepository;
import com.projectF.ComVerse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private CommentMapper commentMapper;

    public CommentDto addComment(CreateCommentRequest request) {

        PostEntity post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Long communityId = post.getRoom().getCommunity().getId();

        if (!membershipRepository.existsByUser_IdAndCommunity_Id(request.getUserId(), communityId)) {
            throw new RuntimeException("Not a community member");
        }

        UserEntity user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CommentEntity comment = CommentEntity.builder()
                .post(post)
                .user(user)
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .build();

        return commentMapper.toDto(commentRepository.save(comment));
    }

    public List<CommentDto> getPostComments(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream().map(commentMapper::toDto).toList();
    }
}
