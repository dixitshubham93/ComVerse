package com.projectF.ComVerse.controller;

import com.projectF.ComVerse.domain.dtos.CreatePostRequest;
import com.projectF.ComVerse.domain.dtos.PostDto;
import com.projectF.ComVerse.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @PostMapping(value = "/create", consumes = "multipart/form-data")
    public PostDto createPost(@ModelAttribute CreatePostRequest request) {
        return postService.createPost(request);
    }

    @GetMapping("/room/{roomId}")
    public Page<PostDto> getRoomPosts(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return postService.getRoomPosts(roomId, page, size);
    }


    @PostMapping("/{postId}/like")
    public int toggleLike(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        return postService.toggleLike(userId, postId);
    }
}
